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

import '@patternfly/react-core/dist/styles/base.css';
import './fonts.css';
import React from 'react';
import {
    Button,
    ButtonVariant,
    Bullseye,
    TextInput,
    Toolbar,
    ToolbarItem,
    ToolbarContent,
    ToolbarFilter,
    ToolbarFilterProps,
    ToolbarToggleGroup,
    ToolbarGroup,
    Dropdown,
    DropdownItem,
    DropdownPosition,
    DropdownToggle,
    InputGroup,
    Title,
    Select,
    SelectOption,
    SelectVariant,
    SelectOptionObject,
    EmptyState,
    EmptyStateIcon,
    EmptyStateBody,
    ToolbarChip,
    ToolbarChipGroup,
    EmptyStateSecondaryActions,
} from '@patternfly/react-core';
import { SearchIcon, FilterIcon } from '@patternfly/react-icons';
import { Table, IActionsResolver, IAction, OnSelect, IRowData, TableHeader, TableBody } from '@patternfly/react-table';
import { History, LocationState } from 'history';
import { copy } from '@app/utils/utils';

type RowT = {
    cells: [{ title: JSX.Element; aName: string }, string];
    selected?: boolean;
};

interface IApplicationsProps {
    history: History<LocationState>;
}

interface IApplicationsState {
    loading?: boolean;
    filters: { [key: string]: Array<string> };
    currentCategory: string;
    isFilterDropdownOpen: boolean;
    isCategoryDropdownOpen: boolean;
    nameInput: string;
    columns: Array<{ title: string }>;
    rows: Array<RowT>;
    inputValue: string;
}

interface IApplications {
    onDelete: ToolbarFilterProps['deleteChip'];
    actionResolver: IActionsResolver;
    onRowSelect: OnSelect;
}

class Applications extends React.Component<IApplicationsProps, IApplicationsState> implements IApplications {
    constructor(props: IApplicationsProps) {
        super(props);
        this.update = this.update.bind(this);
        this.deleteApp = this.deleteApp.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onCategoryToggle = this.onCategoryToggle.bind(this);
        this.onCategorySelect = this.onCategorySelect.bind(this);
        this.onFilterToggle = this.onFilterToggle.bind(this);
        this.onFilterSelect = this.onFilterSelect.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.onRowSelect = this.onRowSelect.bind(this);
        this.onStatusSelect = this.onStatusSelect.bind(this);
        this.onNameInput = this.onNameInput.bind(this);
        this.buildCategoryDropdown = this.buildCategoryDropdown.bind(this);
        this.buildFilterDropdown = this.buildFilterDropdown.bind(this);
        this.renderToolbar = this.renderToolbar.bind(this);
        this.actionResolver = this.actionResolver.bind(this);
        this.goToApplication = this.goToApplication.bind(this);
        this.deleteSelectedRows = this.deleteSelectedRows.bind(this);

        this.state = {
            filters: {
                name: [],
                status: [],
            },
            currentCategory: 'Status',
            isFilterDropdownOpen: false,
            isCategoryDropdownOpen: false,
            nameInput: '',
            columns: [{ title: 'Name' }, { title: 'Status' }],
            rows: [
                { cells: [{ title: <a>CacheApp1</a>, aName: 'CacheApp1' }, 'New'] },
                { cells: [{ title: <a>CacheApp2</a>, aName: 'CacheApp2' }, 'Plan'] },
                { cells: [{ title: <a>CacheApp3</a>, aName: 'CacheApp3' }, 'Done'] },
            ],
            inputValue: '',
        };
    }

    componentDidMount(): void {
        this.update();
    }

    async update(): Promise<void> {
        try {
            const res = await fetch('/api/v1/applications', { headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(`Failed to get the applications. Status: ${res.status}`);
            const data = await res.json();
            const applications: Array<{ name: string; status: Array<string> }> = data.applications;
            const rows: Array<RowT> = [];
            for (const { name, status } of applications) {
                rows.push({
                    cells: [
                        {
                            title: <a onClick={() => this.goToApplication(name)}>{name}</a>,
                            aName: name,
                        },
                        JSON.stringify(status),
                    ],
                });
            }
            this.setState({ rows });
        } catch (e) {
            console.error(e);
        }
    }

    async deleteApp(aName: string): Promise<void> {
        try {
            const res = await fetch('/api/v1/applications/' + encodeURIComponent(aName), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.status > 300) {
                alert('Error while trying to deleting application.');
                throw new Error(`Failed to delete the app${aName}. Status: ${res.status}`);
            }
            this.update();
        } catch (e) {
            console.error(e);
        }
    }

    onDelete(category: string | ToolbarChipGroup, chip: string | ToolbarChip): void {
        const type = category as string;
        const id = chip as string;
        if (type) {
            this.setState((prevState) => {
                const filters = copy(prevState.filters);
                filters[type.toLowerCase()] = filters[type.toLowerCase()].filter((s) => s !== id);
                return { filters };
            });
        } else {
            this.setState({ filters: { name: [], status: [] } });
        }
    }

    onCategoryToggle(isOpen: boolean): void {
        this.setState({ isCategoryDropdownOpen: isOpen });
    }

    onCategorySelect(event?: React.SyntheticEvent<HTMLDivElement>): void {
        if (!event) return;
        this.setState({
            currentCategory: (event.target as HTMLDivElement).innerText,
            isCategoryDropdownOpen: !this.state.isCategoryDropdownOpen,
        });
    }

    onFilterToggle(isOpen: boolean): void {
        this.setState({ isFilterDropdownOpen: isOpen });
    }

    // TODO: This is never used. This or onStatusSelect needs to be removed.
    onFilterSelect(): void {
        this.setState({ isFilterDropdownOpen: !this.state.isFilterDropdownOpen });
    }

    onInputChange(inputValue: string): void {
        this.setState({ inputValue });
    }

    onRowSelect(_: React.FormEvent<HTMLInputElement>, isSelected: boolean, rowId: number): void {
        if (rowId === -1) {
            return this.setState((prevState) => {
                const rows = prevState.rows.map((row) => {
                    row.selected = isSelected;
                    return row;
                });
                return { rows };
            });
        }
        return this.setState((prevState) => {
            const rows = prevState.rows.slice();
            const row = copy(rows[rowId]);
            row.selected = isSelected;
            rows[rowId] = row;
            return { rows };
        });
    }

    onStatusSelect(event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject): void {
        const selection = value as string;
        const checked = (event.target as HTMLInputElement).checked;
        this.setState((prevState) => {
            const prevSelections = prevState.filters['status'];
            return {
                filters: {
                    ...prevState.filters,
                    status: checked
                        ? [...prevSelections, selection]
                        : prevSelections.filter((value) => value !== selection),
                },
            };
        });
    }

    onNameInput(): void {
        const { inputValue } = this.state;
        this.setState((prevState) => {
            const prevFilters = prevState.filters['name'];
            return {
                filters: {
                    ...prevState.filters,
                    ['name']: prevFilters.includes(inputValue) ? prevFilters : [...prevFilters, inputValue],
                },
                inputValue: '',
            };
        });
    }

    buildCategoryDropdown(): JSX.Element {
        const { isCategoryDropdownOpen, currentCategory } = this.state;

        return (
            <ToolbarItem>
                <Dropdown
                    onSelect={this.onCategorySelect}
                    position={DropdownPosition.left}
                    toggle={
                        <DropdownToggle onToggle={this.onCategoryToggle} style={{ width: '100%' }}>
                            <FilterIcon /> {currentCategory}
                        </DropdownToggle>
                    }
                    isOpen={isCategoryDropdownOpen}
                    dropdownItems={[
                        <DropdownItem key="cat1">Name</DropdownItem>,
                        <DropdownItem key="cat3">Status</DropdownItem>,
                    ]}
                    style={{ width: '100%' }}
                ></Dropdown>
            </ToolbarItem>
        );
    }

    buildFilterDropdown(): JSX.Element {
        const { currentCategory, isFilterDropdownOpen, inputValue, filters } = this.state;

        const statusMenuItems = [
            <SelectOption key="statusAssets" value="Assets" />,
            <SelectOption key="statusPlan" value="Plan" />,
            <SelectOption key="statusPlanning" value="Planning" />,
            <SelectOption key="statusArtifacts" value="Artifacts" />,
        ];

        return (
            <>
                <ToolbarFilter
                    chips={filters.name}
                    deleteChip={this.onDelete}
                    categoryName="Name"
                    showToolbarItem={currentCategory === 'Name'}
                >
                    <InputGroup>
                        <TextInput
                            name="nameInput"
                            id="nameInput1"
                            type="search"
                            aria-label="name filter"
                            onChange={this.onInputChange}
                            value={inputValue}
                            placeholder="Filter by name..."
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') this.onNameInput();
                            }}
                        />
                        <Button
                            variant={ButtonVariant.control}
                            aria-label="search button for search input"
                            onClick={this.onNameInput}
                        >
                            <SearchIcon />
                        </Button>
                    </InputGroup>
                </ToolbarFilter>
                <ToolbarFilter
                    chips={filters.status}
                    deleteChip={this.onDelete}
                    categoryName="Status"
                    showToolbarItem={currentCategory === 'Status'}
                >
                    <Select
                        variant={SelectVariant.checkbox}
                        aria-label="Status"
                        onToggle={this.onFilterToggle}
                        onSelect={this.onStatusSelect}
                        selections={filters.status}
                        isOpen={isFilterDropdownOpen}
                        placeholderText="Filter by status"
                    >
                        {statusMenuItems}
                    </Select>
                </ToolbarFilter>
            </>
        );
    }

    renderToolbar(): JSX.Element {
        return (
            <Toolbar
                id="toolbar-with-chip-groups"
                clearAllFilters={() => this.onDelete('', '')}
                collapseListedFiltersBreakpoint="xl"
            >
                <ToolbarContent>
                    <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
                        <ToolbarGroup variant="filter-group">
                            {this.buildCategoryDropdown()}
                            {this.buildFilterDropdown()}
                        </ToolbarGroup>
                    </ToolbarToggleGroup>
                    <ToolbarItem variant="separator" />
                    <ToolbarItem>
                        <Button onClick={() => this.props.history.push('/newapp')}>New Application</Button>
                        <ToolbarItem variant="separator" />
                        {this.state.rows.some((row) => row.selected) && (
                            <Button variant="danger" onClick={this.deleteSelectedRows}>
                                Delete Selected
                            </Button>
                        )}
                    </ToolbarItem>
                </ToolbarContent>
            </Toolbar>
        );
    }

    goToApplication(aName: string): void {
        const value = new URLSearchParams(window.location.search);
        const debugSuffix = value.get('debug') ? `?debug=${value.get('debug')}` : '';
        const url = '/application/' + encodeURIComponent(aName) + debugSuffix;
        this.props.history.push(url);
    }

    actionResolver(): IAction[] {
        return [
            {
                title: 'Details',
                /*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
                onClick: (_: React.MouseEvent, __: number, rowData: IRowData) => {
                    if (!rowData.cells || rowData.cells.length === 0) return;
                    this.goToApplication((rowData as RowT).cells[0].aName as string);
                },
            },
            {
                title: 'Delete',
                /*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
                onClick: (_: React.MouseEvent, __: number, rowData: IRowData) => {
                    if (!rowData.cells || rowData.cells.length === 0) return;
                    this.deleteApp((rowData as RowT).cells[0].aName);
                },
            },
        ];
    }

    deleteSelectedRows() {
        const selectedRows = this.state.rows.filter((row) => row.selected);
        selectedRows.forEach((selectedRow) => this.deleteApp(selectedRow.cells[0].aName));
    }

    render(): JSX.Element {
        const { loading, rows, columns, filters } = this.state;

        function filterFunc(row: RowT): boolean {
            let matchedName = true;
            if (filters.name.length > 0) {
                matchedName = filters.name.some((name) =>
                    row.cells[0].aName.toLowerCase().includes(name.toLowerCase()),
                );
            }
            let matchedStatus = true;
            if (filters.status.length > 0) {
                const cellStatuses: Array<string> = JSON.parse(row.cells[1]).map((cellStatus: string) =>
                    cellStatus.toLowerCase(),
                );
                matchedStatus = filters.status.some((status) => cellStatuses.includes(status.toLowerCase()));
            }
            return matchedName && matchedStatus;
        }

        function applyFilter(rows: Array<RowT>): Array<RowT> {
            if (filters.name.length === 0 && filters.status.length === 0) return rows;
            return rows.filter(filterFunc);
        }
        const filteredRows = applyFilter(rows);

        return (
            <>
                {this.renderToolbar()}
                {!loading && filteredRows.length > 0 && (
                    <Table
                        cells={columns}
                        rows={filteredRows}
                        onSelect={this.onRowSelect}
                        actionResolver={this.actionResolver}
                        aria-label="Applications"
                    >
                        <TableHeader />
                        <TableBody />
                    </Table>
                )}
                {!loading && filteredRows.length === 0 && (
                    <>
                        <Table
                            cells={columns}
                            rows={filteredRows}
                            onSelect={this.onRowSelect}
                            aria-label="Applications"
                        >
                            <TableHeader />
                            <TableBody />
                        </Table>
                        <Bullseye>
                            <EmptyState>
                                <EmptyStateIcon icon={SearchIcon} />
                                <Title headingLevel="h5" size="lg">
                                    No results found
                                </Title>
                                <EmptyStateBody>
                                    No results match this filter criteria. Remove all filters or clear all filters to
                                    show results.
                                </EmptyStateBody>
                                <EmptyStateSecondaryActions>
                                    <Button variant="link" onClick={() => this.onDelete('', '')}>
                                        Clear all filters
                                    </Button>
                                </EmptyStateSecondaryActions>
                            </EmptyState>
                        </Bullseye>
                    </>
                )}
                {loading && (
                    <div style={{ textAlign: 'center' }}>
                        <Title headingLevel="h2" size="3xl">
                            Please wait while loading data
                        </Title>
                    </div>
                )}
            </>
        );
    }
}

export { Applications };
