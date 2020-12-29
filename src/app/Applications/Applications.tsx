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
import "@patternfly/react-core/dist/styles/base.css";
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
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions
} from '@patternfly/react-core';
import { SearchIcon, FilterIcon } from '@patternfly/react-icons';
import { Table, TableHeader, TableBody } from '@patternfly/react-table';
import { NewApplication } from '@app/Application/NewApplication';
import queryString from 'query-string'

class Applications extends React.Component {

  componentDidMount() {
    this.update();
  }

  constructor(props) {
    super(props);
    this.state = {
      filters: {
        name: [],
        status: []
      },
      currentCategory: 'Status',
      isFilterDropdownOpen: false,
      isCategoryDropdownOpen: false,
      nameInput: '',
      columns: [
        { title: 'Name' },
        { title: 'Status' }
      ],
      rows: [
        { cells: ['CacheApp1', 'New'] },
        { cells: ['CacheApp2', 'Plan'] },
        { cells: ['CacheApp3', 'Done'] }
      ],
      inputValue: ''
    };

    this.update = () => {
        fetch('/api/v1/applications', 
        {
          headers: {
          'Content-Type': 'application/json'
          }
        }
      )
      .then(res => res.json())
      .then((data) => {
        var applications = data.applications
        var rows = new Array(applications.length)
        for (var index = 0; index < applications.length; index++) { 
          var row = new Array(4);
          row[0] = applications[index]["name"]
          row[1] = JSON.stringify(applications[index]["status"])
          rows[index] = { "cells" : row }
        } 
        this.setState({ rows: rows })
      })
      .catch(console.log)
    }
    this.update.bind(this);

    this.onNewApp = () => {

    }

    this.deleteApp = (aName) => {
        fetch('/api/v1/applications/'+aName, 
        {
            method: "DELETE",
            headers: {
            'Content-Type': 'application/json'
            }
        }
        )
        .then((res) => {
            if(res.status > 300) {
                alert("Error while trying to deleting application.");
              } else {
                this.update();
              }
        })
        .catch(console.log);
    }

    this.onDelete = (type = '', id = '') => {
      if (type) {
        this.setState(prevState => {
          prevState.filters[type.toLowerCase()] = prevState.filters[type.toLowerCase()].filter(s => s !== id);
          return {
            filters: prevState.filters
          };
        });
      } else {
        this.setState({
          filters: {
            name: [],
            status: []
          }
        });
      }
    };

    this.onCategoryToggle = isOpen => {
      this.setState({
        isCategoryDropdownOpen: isOpen
      });
    };

    this.onCategorySelect = event => {
      this.setState({
        currentCategory: event.target.innerText,
        isCategoryDropdownOpen: !this.state.isCategoryDropdownOpen
      });
    };

    this.onFilterToggle = isOpen => {
      this.setState({
        isFilterDropdownOpen: isOpen
      });
    };

    this.onFilterSelect = event => {
      this.setState({
        isFilterDropdownOpen: !this.state.isFilterDropdownOpen
      });
    };

    this.onInputChange = newValue => {
      this.setState({ inputValue: newValue });
    };

    this.onRowSelect = (event, isSelected, rowId) => {
      let rows;
      if (rowId === -1) {
        rows = this.state.rows.map(oneRow => {
          oneRow.selected = isSelected;
          return oneRow;
        });
      } else {
        rows = [...this.state.rows];
        rows[rowId].selected = isSelected;
      }
      this.setState({
        rows
      });
    };

    this.onStatusSelect = (event, selection) => {
      const checked = event.target.checked;
      this.setState(prevState => {
        const prevSelections = prevState.filters['status'];
        return {
          filters: {
            ...prevState.filters,
            status: checked ? [...prevSelections, selection] : prevSelections.filter(value => value !== selection)
          }
        };
      });
    };

    this.onNameInput = event => {
      if (event.key && event.key !== 'Enter') {
        return;
      }

      const { inputValue } = this.state;
      this.setState(prevState => {
        const prevFilters = prevState.filters['name'];
        return {
          filters: {
            ...prevState.filters,
            ['name']: prevFilters.includes(inputValue) ? prevFilters : [...prevFilters, inputValue]
          },
          inputValue: ''
        };
      });
    };
  }

  buildCategoryDropdown() {
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
            <DropdownItem key="cat3">Status</DropdownItem>
          ]}
          style={{ width: '100%' }}
        ></Dropdown>
      </ToolbarItem>
    );
  }

  buildFilterDropdown() {
    const { currentCategory, isFilterDropdownOpen, inputValue, filters } = this.state;

    const statusMenuItems = [
      <SelectOption key="statusAssets" value="Assets" />,
      <SelectOption key="statusPlan" value="Plan" />,
      <SelectOption key="statusPlanning" value="Planning" />,
      <SelectOption key="statusArtifacts" value="Artifacts" />
    ];

    return (
      <React.Fragment>
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
              onKeyDown={this.onNameInput}
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
      </React.Fragment>
    );
  }

  renderToolbar(update) {
    const { filters } = this.state;
    return (
      <Toolbar
        id="toolbar-with-chip-groups"
        clearAllFilters={this.onDelete}
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
          <ToolbarItem><NewApplication update={update}/></ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    );
  }

  actionResolver(rowData, { rowIndex }, deleteApp) {
    return [
      {
        title: 'Details',
        onClick: (event, rowId, rowData, extra) => {
          var url = "/application/"+rowData.cells[0]
          const value=queryString.parse(location.search);
          const flag=value.debug;
          if(typeof flag !== "undefined") {
              url += "?debug="+flag;
          }
          window.location.href=url
        }
      },{
        title: 'Delete',
        onClick: (event, rowId, rowData, extra) => {
          deleteApp(rowData.cells[0])
        }
      }
    ];
  }

  render() {
    const { loading, rows, columns, filters } = this.state;

    const filteredRows =
      filters.name.length > 0 || filters.status.length > 0
        ? rows.filter(row => {
            return (
              (filters.name.length === 0 ||
                filters.name.some(name => row.cells[0].toLowerCase().includes(name.toLowerCase()))) &&
              (filters.status.length === 0 || (row.cells[2] && filters.status.some(status => row.cells[2].toLowerCase().includes(status.toLowerCase()))))
            );
          })
        : rows;

    return (
      <React.Fragment>
        {this.renderToolbar(this.update)}
        {!loading && filteredRows.length > 0 && (
          <Table cells={columns} rows={filteredRows} onSelect={this.onRowSelect} actionResolver={(rowData, { rowIndex }) => { return this.actionResolver(rowData, {rowIndex}, this.deleteApp) }} aria-label="Applications">
            <TableHeader />
            <TableBody />
          </Table>
        )}
        {!loading && filteredRows.length === 0 && (
          <React.Fragment>
            <Table cells={columns} rows={filteredRows} onSelect={this.onRowSelect} aria-label="Applications">
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
                  No results match this filter criteria. Remove all filters or clear all filters to show results.
                </EmptyStateBody>
                <EmptyStateSecondaryActions>
                  <Button variant="link" onClick={() => this.onDelete(null)}>
                    Clear all filters
                  </Button>
                </EmptyStateSecondaryActions>
              </EmptyState>
            </Bullseye>
          </React.Fragment>
        )}
        {loading && (
          <center>
            <Title headingLevel="h2" size="3xl">Please wait while loading data</Title>
          </center>
        )}
      </React.Fragment>
    );
  }
}

export { Applications };