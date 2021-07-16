/* eslint-disable @typescript-eslint/no-var-requires */
/*
Copyright IBM Corporation 2020

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const winston = require('winston');
const fetch = require('node-fetch');
const passport = require('passport');
const session = require('express-session');
const { SignJWT } = require('jose/jwt/sign');
const validate = require('jsonschema').validate;
const { UnsecuredJWT } = require('jose/jwt/unsecured');
const SamlStrategy = require('passport-saml').Strategy;
const FileStore = require('session-file-store')(session);
const OAuth2Strategy = require('passport-oauth2').Strategy;
const { createProxyMiddleware } = require('http-proxy-middleware');

let config = {};
let logger = winston;

// Utilities ------------------------------------------------------------------------------------------

function newUser(idp_type, idp_id, idp_user_id, name, image) {
    return { idp_type, idp_id, idp_user_id, name, image };
}

function getUserFromProfile(idp, profile) {
    logger.debug('getUserFromProfile idp:', idp, 'profile:', profile);
    if (!idp || !profile || !profile[idp.profile_id]) return false;
    return newUser(
        idp.type,
        idp.id,
        profile[idp.profile_id],
        idp.profile_name ? profile[idp.profile_name] : profile[idp.profile_id],
        idp.profile_image ? profile[idp.profile_image] : '',
    );
}

function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401);
    res.header('WWW-Authenticate', 'Bearer realm="Access to the Move2Kube UI');
    res.json({ error: 'unauthenticated: please login to use this endpoint' });
}

function normalizeDomain(domain) {
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) domain = 'https://' + domain;
    return new URL(domain).host;
}

// Strategies ------------------------------------------------------------------------------------------

// SAML

class SessionStoreBasedCacheProvider {
    // a passport-saml cache provider based on a express-session session store
    // https://github.com/node-saml/passport-saml#cache-provider
    // https://github.com/expressjs/session#session-store-implementation
    constructor(store, logFn) {
        this.store = store;
        this.logFn = logFn;
    }
    async saveAsync(key, value) {
        this.logFn('saveAsync key:', key, 'value:', value);
        return new Promise((resolve, reject) => {
            this.store.set(key, { value }, (err) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
        // saves the key with the optional value, returns the saved value
    }
    async getAsync(key) {
        this.logFn('getAsync key:', key);
        return new Promise((resolve, reject) => {
            this.store.get(key, (err, payload) => {
                if (err) {
                    if (err.code === 'ENOENT') return resolve(null);
                    return reject(err);
                }
                resolve(payload.value);
            });
        });
        // returns the value if found, null otherwise
    }
    async removeAsync(key) {
        this.logFn('removeAsync key:', key);
        if ((await this.getAsync(key)) === null) return null;
        return new Promise((resolve, reject) => {
            this.store.destroy(key, (err) => {
                if (err) return reject(err);
                resolve(key);
            });
        });
        // removes the key from the cache, returns the
        // key removed, null if no key is removed
    }
}

function verifyUserSAML(idp, profile, done) {
    logger.debug('verifyUserSAML idp:', idp, 'profile:', profile);
    return done(null, getUserFromProfile(idp, profile));
}

// OAuth 2.0

async function verifyUserOAuth2(idp, accessToken, refreshToken, _profile, done) {
    logger.debug(
        'verifyUserOAuth2 idp:',
        idp,
        'accessToken:',
        accessToken,
        'refreshToken:',
        refreshToken,
        '_profile:',
        _profile,
    );
    const res = await fetch(idp.profile_url, {
        headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' },
    });
    if (!res.ok)
        return done(
            new Error(`failed to fetch the user profile from the url ${idp.profile_url} status: ${res.status}`),
            false,
        );
    const profile = await res.json();
    logger.debug('verifyUserOAuth2 after fetching, profile:', profile);
    return done(null, getUserFromProfile(idp, profile));
}

async function getOIDCURLs(discovery_url) {
    // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
    // https://developers.google.com/identity/protocols/oauth2/openid-connect#discovery
    // https://accounts.google.com/.well-known/openid-configuration
    const res = await fetch(discovery_url, { headers: { Accept: 'application/json' } });
    if (!res.ok)
        throw new Error(
            `failed to fetch the OIDC discovery document from the url ${discovery_url} status: ${res.status}`,
        );
    return res.json();
}

// Setup ------------------------------------------------------------------------------------------

function setupLogger(argv) {
    const SPLAT = Symbol.for('splat');
    const pad = winston.format((info) => ({ ...info, level: info.level.padEnd(7) }));
    const all = winston.format((info) => {
        const f = (param) => (typeof param === 'object' ? JSON.stringify(param) : param);
        const splat = info[SPLAT] || [];
        info.message = `${f(info.message)} ${splat.map(f).join(' ')}`;
        return info;
    });
    const consoleFormat = winston.format.combine(
        all(),
        pad(),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ level, message }) => `[${level}] ${message}`),
    );
    const fileFormat = winston.format.combine(all(), winston.format.timestamp(), winston.format.json());
    const transports = [new winston.transports.Console({ format: consoleFormat })];
    if (argv.log) transports.push(new winston.transports.File({ filename: argv.log, format: fileFormat }));
    logger = winston.createLogger({
        silent: argv.silent,
        level: argv.verbose ? 'debug' : 'info',
        transports,
    });
    logger.info(`starting move2kube-ui in ${process.env.NODE_ENV || 'development'} mode....`);
}

function loadAuth(path) {
    logger.info('loading authorization details from the file at path', path);
    try {
        const a = JSON.parse(fs.readFileSync(path, 'utf-8'));
        validateAuthFile(a);
        return a;
    } catch (e) {
        throw new Error(`failed to load the authorization details from the file at path ${path} . ${e}`);
    }
}

function validateAuthFile(authDetails) {
    logger.debug('validateAuthFile authDetails:', authDetails);
    const schema = {
        type: 'object',
        description: 'authentication details for used by m2k UI and API servers',
        required: ['is_auth_enabled', 'session_secret'],
        properties: {
            is_auth_enabled: {
                type: 'boolean',
                description: 'whether authentication and authorization is enabled',
                default: false,
            },
            domain: {
                type: 'string',
                description:
                    'domain at which the UI server is deployed. Required if an OAuth 2.0 identity provider is configured',
            },
            session_secret: {
                type: 'string',
                description: 'secret used to sign session ids',
            },
            session_store_encryption_secret: {
                type: 'string',
                description: 'secret used to encrypt session data while it is stored on disk',
            },
            session_store_path: {
                type: 'string',
                description: 'path to a directory where the session files will be stored',
                default: 'sessions/common',
            },
            saml_id_store_path: {
                type: 'string',
                description:
                    'path to a directory where the SAML request ids will be stored. Required if a SAML identity provider is configured',
                default: 'sessions/saml-ids',
            },
            saml_id_expiration_time: {
                type: 'number',
                description:
                    'time after which the SAML request will expire. If we receive a response after this time we will reject it. Default is 20 minutes',
                default: 20 * 60 * 1000,
            },
            trust_proxy: {
                type: 'object',
                description:
                    'useful for when the server is running behind a proxy and the TLS/HTTPS connection is terminated at the proxy (like inside a k8s cluster)',
                properties: {
                    disable: {
                        type: 'boolean',
                        description: "don't trust any proxies in front of our server. By default we will trust 1 proxy",
                        default: false,
                    },
                    hops: {
                        type: 'number',
                        description: 'trust at most this number of hops/proxies directly in front of our server',
                        default: 1,
                    },
                },
            },
            api_proxy: {
                type: 'object',
                description: 'details about the proxy that forwards requests to the API server',
                properties: {
                    access_token: {
                        type: 'object',
                        description:
                            'the access token is a JWT that contains information about the user making the request',
                        properties: {
                            expiration_time: {
                                type: 'string',
                                description: 'amount of time for which the access token should be valid',
                            },
                            sign: {
                                type: 'object',
                                description: 'used to sign the access token using a private key',
                                properties: {
                                    algorithm: {
                                        type: 'string',
                                        description: 'algorithm to use for signing',
                                    },
                                    private_key: {
                                        type: 'object',
                                        description: 'the private key to use for signing',
                                        properties: {
                                            key: {
                                                type: 'string',
                                                description: 'the key in PEM format base64 encoded',
                                            },
                                            passphrase: {
                                                type: 'string',
                                                description: 'if the key is encrypted provide a passphrase',
                                            },
                                        },
                                        required: ['key'],
                                    },
                                    public_key: {
                                        type: 'string',
                                        description:
                                            'the corresponding public key. This is used to verify the JWT on the API server',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            identity_providers: {
                type: 'array',
                description: 'this is an array of identity providers',
                items: {
                    type: 'object',
                    description:
                        'each identity provider must have at least a type, id and name but other fields may be required depending on the Each provider must have at least a type, id and name but other fields may be required depending on the type of the identity provider',
                    properties: {
                        disable: {
                            type: 'boolean',
                            description:
                                'useful for quickly disabling an identity provider for testing/debugging purposes',
                            default: false,
                        },
                        type: {
                            type: 'string',
                            description:
                                'the type of authentication provided by the identity provider (SAML, OAuth 2.0, etc.)',
                            pattern: '^[a-zA-Z0-9-_]+$',
                        },
                        id: {
                            type: 'string',
                            description: 'a custom unique alphanumeric identifier for this identity provider',
                            pattern: '^[a-zA-Z0-9-_]+$',
                        },
                        name: {
                            type: 'string',
                            description:
                                'a human readable name for this authentication strategy. This will be displayed in the UI',
                        },
                    },
                    required: ['type', 'id', 'name'],
                },
            },
        },
    };
    const result = validate(authDetails, schema, { required: true });
    logger.debug('validation result', result);
    if (result.valid) return;
    const errors = result.errors.map((x) => `Error: ${x.property} ${x.message}. Actual: ${JSON.stringify(x.instance)}`);
    logger.error(errors.join('\n'));
    throw new Error('invalid auth file');
}

function loadKeys() {
    logger.debug('loadKeys');
    try {
        if (config?.api_proxy?.access_token?.sign?.private_key) {
            config.api_proxy.access_token.sign.private_key.key = Buffer.from(
                config.api_proxy.access_token.sign.private_key.key,
                'base64',
            );
            config.api_proxy.access_token.sign.private_key = crypto.createPrivateKey(
                config.api_proxy.access_token.sign.private_key,
            );
            logger.info(
                'm2k api proxy access token signing is enabled. Using algorithm',
                config.api_proxy.access_token.sign.algorithm,
            );
        } else {
            logger.info('m2k api proxy access token signing is disabled');
        }
    } catch (e) {
        throw new Error(`failed to load the private key for signing JWTs. ${e}`);
    }
}

async function setupAuth(app, passport, apiProxy, req_logger) {
    if (!config.trust_proxy || !config.trust_proxy.disable) app.set('trust proxy', config?.trust_proxy?.hops || 1);
    app.use(express.urlencoded({ extended: false }));
    app.use(
        session({
            store: new FileStore({
                logFn: logger.debug.bind(logger),
                path: config.session_store_path || 'sessions/common',
                secret: config.session_store_encryption_secret || config.session_secret,
            }),
            resave: false,
            saveUninitialized: false,
            secret: config.session_secret,
            cookie: { httpOnly: true, sameSite: 'strict', secure: true },
        }),
    );

    const login_options = [];
    const do_afters = [];
    const seen_auth_strategies = new Set();
    for (const identity_provider of config.identity_providers) {
        logger.debug('identity provider', identity_provider);
        if (identity_provider.disable) {
            logger.debug(`the identity provider ${identity_provider.id} is disabled`);
            continue;
        }
        const auth_strategy = identity_provider.type + ',' + identity_provider.id;
        if (seen_auth_strategies.has(auth_strategy)) {
            logger.error(
                'duplicate identity provider. The identity provider',
                identity_provider.type,
                identity_provider.id,
                'has been specified multiple times',
            );
            continue;
        }
        seen_auth_strategies.add(auth_strategy);
        const login_path = `/login/${identity_provider.type}/${identity_provider.id}`;
        const callback_path = `${login_path}/callback`;
        const successRedirect = '/';
        const failureRedirect = '/login';
        if (identity_provider.type === 'saml') {
            const store_path = path.join(config.saml_id_store_path || 'sessions/saml-ids', auth_strategy);
            passport.use(
                auth_strategy,
                new SamlStrategy(
                    {
                        protocol: 'https',
                        path: callback_path,
                        entryPoint: identity_provider.sso_url,
                        cert: identity_provider.sso_cert,
                        issuer: identity_provider.sp_entity_id,
                        audience: identity_provider.sp_entity_id,
                        validateInResponseTo: true,
                        requestIdExpirationPeriodMs: config.saml_id_expiration_time || 20 * 60 * 1000, // 20 minutes
                        cacheProvider: new SessionStoreBasedCacheProvider(
                            new FileStore({
                                path: store_path,
                                secret: config.session_store_encryption_secret || config.session_secret,
                            }),
                            logger.debug.bind(logger),
                        ),
                    },
                    (profile, done) => verifyUserSAML(identity_provider, profile, done),
                ),
            );
            login_options.push({
                idp_type: identity_provider.type,
                idp_id: identity_provider.id,
                idp_name: identity_provider.name,
            });
            do_afters.push(() => {
                app.post(
                    callback_path,
                    req_logger('post', callback_path),
                    passport.authenticate(auth_strategy, { successRedirect, failureRedirect }),
                ); // TODO: might need some CSRF protection for this POST route
                app.get(
                    login_path,
                    req_logger('get', login_path),
                    passport.authenticate(auth_strategy, { successRedirect, failureRedirect }),
                );
            });
            logger.info('added identity provider', identity_provider.type, identity_provider.id);
            continue;
        }
        if (identity_provider.type === 'oauth2') {
            let normalizedDoman = config.domain;
            try {
                normalizedDoman = normalizeDomain(config.domain);
            } catch (e) {
                logger.error(
                    'failed to add the identity provider',
                    identity_provider.type,
                    identity_provider.id,
                    'because the domain',
                    config.domain,
                    'is invalid. Error:',
                    e,
                );
                continue;
            }
            const { authorization_endpoint, token_endpoint, userinfo_endpoint } = await getOIDCURLs(
                identity_provider.oidc_discovery_url,
            );
            identity_provider.profile_url = userinfo_endpoint;
            passport.use(
                auth_strategy,
                new OAuth2Strategy(
                    {
                        scope: ['profile'],
                        authorizationURL: authorization_endpoint,
                        tokenURL: token_endpoint,
                        clientID: identity_provider.client_id,
                        clientSecret: identity_provider.client_secret,
                        // can't use relative urls https://github.com/jaredhanson/passport-oauth2/issues/137
                        callbackURL: `https://${normalizedDoman}${callback_path}`,
                    },
                    (accessToken, refreshToken, _profile, done) =>
                        verifyUserOAuth2(identity_provider, accessToken, refreshToken, _profile, done),
                ),
            );
            login_options.push({
                idp_type: identity_provider.type,
                idp_id: identity_provider.id,
                idp_name: identity_provider.name,
            });
            do_afters.push(() => {
                app.get(
                    callback_path,
                    req_logger('get', callback_path),
                    passport.authenticate(auth_strategy, { scope: ['profile'], successRedirect, failureRedirect }),
                );
                app.get(
                    login_path,
                    req_logger('get', login_path),
                    passport.authenticate(auth_strategy, { scope: ['profile'], successRedirect, failureRedirect }),
                );
            });
            logger.info('added identity provider', identity_provider.type, identity_provider.id);
            continue;
        }
        logger.warn(
            'unknown type of identity provider',
            identity_provider.type,
            '\nidentity_provider:',
            identity_provider,
        );
    }

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    app.use(passport.initialize());
    app.use(passport.session());

    do_afters.forEach((f) => f());

    app.get('/auth/login-options', req_logger('get', '/auth/login-options'), (req, res) => res.json(login_options));
    app.get('/auth/user-profile', req_logger('get', '/auth/user-profile'), checkAuthentication, (req, res) =>
        res.json(req.user),
    );
    app.delete('/logout', req_logger('delete', '/logout'), checkAuthentication, (req, res) => {
        req.logOut();
        res.redirect('/login');
    });
    app.use(
        '/api',
        req_logger('use', '/api'),
        (req, res, next) => (req.url === '/v1/support' ? next() : checkAuthentication(req, res, next)),
        insertUserInfo,
        apiProxy,
    );
}

// API proxy JWT access token middleware

function addJWTMetadata(jwt) {
    return jwt
        .setIssuedAt()
        .setExpirationTime(config?.api_proxy?.access_token?.expiration_time || '2h')
        .setIssuer('m2k-ui-server')
        .setAudience('m2k-api-server');
}

async function getJWT(payload) {
    if (config?.api_proxy?.access_token?.sign?.private_key) {
        return await addJWTMetadata(new SignJWT(payload))
            .setProtectedHeader({ alg: config.api_proxy.access_token.sign.algorithm })
            .sign(config.api_proxy.access_token.sign.private_key);
    }
    return new Promise((resolve) => resolve(addJWTMetadata(new UnsecuredJWT(payload)).encode()));
}

async function insertUserInfo(req, res, next) {
    if (req.user) {
        const jwt = await getJWT({ ...req.user, image: '' });
        req.headers['Authorization'] = 'Bearer ' + jwt;
        logger.debug('jwt', jwt);
    }
    logger.debug('proxying request to api with the headers', req.headers);
    next();
}

// Main ------------------------------------------------------------------------------------------

async function main() {
    // Parse the command line arguments
    const argv = require('yargs/yargs')(require('yargs/helpers').hideBin(process.argv))
        .version(false)
        .alias('h', 'help')
        .option('v', {
            type: 'boolean',
            alias: 'verbose',
            demandOption: false,
            default: false,
            describe: 'print even more logs (useful for debugging)',
        })
        .option('a', {
            type: 'string',
            alias: 'auth',
            demandOption: false,
            describe: 'the path to the file containing authentication details',
        })
        .option('l', {
            type: 'string',
            alias: 'log',
            demandOption: false,
            describe: 'if specified, the logs will be written to this log file (as well as the console)',
        })
        .option('s', {
            type: 'boolean',
            alias: 'silent',
            demandOption: false,
            default: false,
            describe: 'disable all logging',
        })
        .option('p', {
            type: 'number',
            alias: 'port',
            demandOption: false,
            default: 8080,
            describe: 'the port to listen on',
        })
        .usage('Usage: node $0 [options]')
        .example('node $0')
        .example('node $0 --auth path/to/auth.json')
        .example('node $0 --auth path/to/auth.json --log path/to/write/log/file')
        .example('node $0 --auth path/to/auth.json --port 3000')
        .example('node $0 --auth path/to/auth.json --port 3000 --silent').argv;

    setupLogger(argv);

    if (argv.auth) config = loadAuth(argv.auth);

    const req_logger = (method, route) => (req, res, next) => {
        logger.info(`${req.method} ${req.url} handled by app.${method}('${route}')`);
        next();
    };
    const apiProxy = createProxyMiddleware({
        target: process.env.MOVE2KUBEAPI || 'http://move2kubeapi:8080',
        changeOrigin: true,
    });

    const app = express();
    app.use(express.static(path.join(__dirname, 'dist')));

    if (config.is_auth_enabled) {
        logger.info('authentication is enabled');
        loadKeys();
        await setupAuth(app, passport, apiProxy, req_logger);
    } else {
        logger.info('authentication is disabled');
        app.all('/auth/*', req_logger('all', '/auth/*'), (req, res) => {
            res.status(404);
            res.json({ error: 'authentication is disabled' });
        });
        app.use('/api', req_logger('use', '/api'), apiProxy);
    }

    app.get('*', req_logger('get', '*'), (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

    app.listen(argv.port, () => logger.info(`listening on port ${argv.port}`));
}

main().catch((e) => logger.error('fatal error:', e));
