/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import classNames from 'classnames';

import { Modal } from '../../../shared/ui';

import Input from './Input';

import * as css from './ElementTemplatesModalView.less';

import {
  groupBy,
  isDefined,
  isNil,
  isUndefined,
  sortBy
} from 'min-dash';

import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

const MAX_DESCRIPTION_LENGTH = 200;

const DEFAULT_CATEGORY = '__default';

class ElementTemplatesView extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      applied: null,
      elementTemplates: [],
      elementTemplatesFiltered: [],
      expanded: null,
      filter: {
        search: ''
      },
      scroll: false,
      selected: null
    };
  }

  componentDidMount = () => {
    this.getElementTemplates();
  };

  getElementTemplates = async () => {
    const {
      triggerAction
    } = this.props;

    const selectedElement = await triggerAction('getSelectedElement');

    let elementTemplates = await triggerAction('getElementTemplates', { element: selectedElement });

    if (selectedElement) {

      // (1) Filter by valid templates
      // (2) Filter by templates that can be applied
      // (3) Filter by latest version
      // (4) Sort alphabetically
      elementTemplates = sortAlphabetically(filterByLatest(filterByApplicable(
        elementTemplates,
        selectedElement
      )));
    } else {
      elementTemplates = [];
    }

    const selectedElementAppliedElementTemplate = await triggerAction('getSelectedElementAppliedElementTemplate');

    this.setState({
      elementTemplates,
      elementTemplatesFiltered: elementTemplates,
      applied: selectedElementAppliedElementTemplate
    });
  };

  onSelect = ({ id }) => {
    this.setState({
      selected: id
    });
  };

  onToggleExpanded = ({ id }) => {
    const { expanded } = this.state;

    if (expanded === id) {
      this.setState({
        expanded: null
      });
    } else {
      this.setState({
        expanded: id
      });
    }
  };

  onApply = () => {
    const {
      onApply,
      onClose
    } = this.props;

    const {
      elementTemplates,
      selected
    } = this.state;

    if (isNil(selected)) {
      return;
    }

    const elementTemplate = elementTemplates.find(({ id }) => id === selected);

    onApply(elementTemplate);

    onClose();
  };

  onSearchChange = search => {
    const { filter } = this.state;

    this.setFilter({
      ...filter,
      search
    });
  };

  setFilter = filter => {
    const { elementTemplates } = this.state;

    const elementTemplatesFiltered = filterElementTemplates(elementTemplates, filter);

    this.setState({
      elementTemplatesFiltered,
      filter
    });
  };

  onScroll = ({ target }) => {
    this.setState({ scroll: target.scrollTop > 0 });
  };

  render() {
    const { onClose } = this.props;

    const {
      applied,
      elementTemplatesFiltered,
      expanded,
      filter,
      scroll,
      selected
    } = this.state;

    const canApply = elementTemplatesFiltered.find(({ id }) => id === selected);

    const elementTemplatesGrouped = groupBy(elementTemplatesFiltered, ({ category = {} }) => category.name || DEFAULT_CATEGORY);

    const categoriesSorted = sortBy(Object.keys(elementTemplatesGrouped), category => category === DEFAULT_CATEGORY ? '' : category.toLowerCase());

    return (
      <Modal className={ css.ElementTemplatesModalView } onClose={ onClose }>

        <Modal.Title>Select template</Modal.Title>

        <Modal.Body onScroll={ this.onScroll }>

          <div className={ classNames('header', { 'header--scroll': scroll }) }>
            <h2 className="header__title">Templates</h2>
            <div className="header__filter">
              <Input className="header__filter-item" value={ filter.search } onChange={ this.onSearchChange } />
            </div>
          </div>

          {
            categoriesSorted.map((category) => {
              const elementTemplates = elementTemplatesGrouped[ category ];

              return (
                <div key={ category }>
                  {
                    category !== DEFAULT_CATEGORY && <h3 className="element-templates-list__group">{ category }</h3>
                  }
                  <ul className="element-templates-list">
                    {
                      elementTemplates.map(elementTemplate => {
                        const { id, version } = elementTemplate;

                        return (
                          <ElementTemplatesListItem
                            key={ getKey(id, version) }
                            applied={ applied }
                            expanded={ expanded }
                            elementTemplate={ elementTemplate }
                            onSelect={ () => this.onSelect(elementTemplate) }
                            onToggleExpanded={ () => this.onToggleExpanded(elementTemplate) }
                            selected={ selected } />
                        );
                      })
                    }
                  </ul>
                </div>
              );
            })
          }

          {
            !elementTemplatesFiltered.length ? (
              <ul className="element-templates-list">
                <ElementTemplatesListItemEmpty />
              </ul>
            ) : null
          }
        </Modal.Body>

        <Modal.Footer>
          <div className="form-submit">
            <button className="btn btn-secondary button--cancel" type="submit" onClick={ onClose }>
              Cancel
            </button>
            <button
              disabled={ !canApply }
              className="btn btn-primary button--apply"
              type="submit"
              onClick={ this.onApply }
            >
              Apply
            </button>
          </div>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default ElementTemplatesView;

export class ElementTemplatesListItem extends React.PureComponent {
  onSelect = ({ target }) => {
    const { onSelect } = this.props;

    // Do not select on description expand click
    if (target.classList.contains('element-templates-list__item-description-expand')) {
      return;
    }

    onSelect();
  };

  render() {
    const {
      applied,
      elementTemplate,
      expanded,
      onToggleExpanded,
      selected
    } = this.props;

    const {
      description,
      icon = {},
      id,
      name
    } = elementTemplate;

    const version = getVersion(elementTemplate);

    return (
      <li className={
        classNames(
          'element-templates-list__item',
          { 'element-templates-list__item--applied': id === applied },
          { 'element-templates-list__item--selectable': id !== applied },
          { 'element-templates-list__item--selected': id === selected }
        )
      } onClick={ id !== applied && id !== selected ? this.onSelect : null }>
        <div className="element-templates-list__item-header">
          {
            icon.contents && (
              <img className="element-templates-list__item-icon" src={ icon.contents } alt="" />
            )
          }
          <span className="element-templates-list__item-name">{ name }</span>
          {
            !isNil(version) ? <span className="element-templates-list__item-meta">Version { version }</span> : null
          }
        </div>
        {
          isDefined(description) && (
            <div className="element-templates-list__item-description">
              {
                description.length > MAX_DESCRIPTION_LENGTH
                  ? (id !== expanded ? `${ description.substring(0, MAX_DESCRIPTION_LENGTH) } ... ` : `${ description } `)
                  : description
              }
              {
                description.length > MAX_DESCRIPTION_LENGTH
                  ? (
                    <span className="element-templates-list__item-description-expand" onClick={ onToggleExpanded }>
                      {
                        id === expanded ? 'Less' : 'More'
                      }
                    </span>
                  )
                  : null
              }
            </div>
          )
        }
      </li>
    );
  }
}

export class ElementTemplatesListItemEmpty extends PureComponent {
  render() {
    return <li className="element-templates-list__item element-templates-list__item--empty">No matching templates found.</li>;
  }
}

// helpers //////////

function filterByApplicable(elementTemplates, element) {
  return elementTemplates.filter(({ appliesTo }) => {
    return isAny(element, appliesTo);
  });
}

function filterByLatest(elementTemplates) {
  return Object.values(groupBy(elementTemplates, 'id'))
    .map(templates => templates.reduce((latest, template) => {
      if (!latest || template.version > latest.version) {
        return template;
      }

      return latest;
    }, null));
}

function filterElementTemplates(elementTemplates, filter) {
  return elementTemplates.filter(elementTemplate => {
    const { search } = filter;

    const {
      description,
      name
    } = elementTemplate;

    if (search
      && search.length
      && !name.toLowerCase().includes(search.toLowerCase())
      && !(description || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });
}

function getKey(id, version = '_') {
  return `${ id }-${ version }`;
}

function sortAlphabetically(elementTemplates) {
  return elementTemplates.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    } else {
      return 1;
    }
  });
}

export function getVersion(elementTemplate) {
  const { version } = elementTemplate;

  if (isUndefined(version)) {
    return null;
  }

  return version;
}
