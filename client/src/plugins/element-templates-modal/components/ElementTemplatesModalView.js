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

import { Modal } from '../../../app/primitives';

import Dropdown from './Dropdown';
import Input from './Input';

import css from './ElementTemplatesModalView.less';

import {
  isDefined,
  isNil
} from 'min-dash';

const MAX_DESCRIPTION_LENGTH = 200;

class ElementTemplatesView extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      applied: null,
      elementTemplates: [],
      expanded: null,
      filter: {
        tags: [],
        search: ''
      },
      selected: null
    };
  }

  componentDidMount = () => {
    this.getElementTemplates();
  }

  getElementTemplates = async () => {
    const {
      config,
      triggerAction
    } = this.props;

    let elementTemplates = await config.get('bpmn.elementTemplates');

    const selectedElementType = await triggerAction('getSelectedElementType');

    elementTemplates = elementTemplates.filter(({ appliesTo }) => {
      return appliesTo.includes(selectedElementType);
    });

    const selectedElementAppliedElementTemplate = await triggerAction('getSelectedElementAppliedElementTemplate');

    this.setState({
      elementTemplates,
      applied: selectedElementAppliedElementTemplate
    });
  }

  onSelect = ({ id }) => {
    this.setState({
      selected: id
    });
  }

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
  }

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
  }

  onSearchChange = search => {
    const { filter } = this.state;

    this.setState({
      filter: {
        ...filter,
        search
      }
    });
  }

  onTagsChange = tags => {
    const { filter } = this.state;

    this.setState({
      filter: {
        ...filter,
        tags
      }
    });
  }

  render() {
    const { onClose } = this.props;

    const {
      applied,
      elementTemplates,
      expanded,
      filter,
      selected
    } = this.state;

    const {
      tags
    } = filter;

    const tagCounts = getTagCounts(elementTemplates);

    const filteredElementTemplates = filterElementTemplates(elementTemplates, filter);

    return (
      <Modal className={ css.ElementTemplatesModalView } onClose={ onClose }>

        <Modal.Title>Catalog</Modal.Title>

        <Modal.Body>
          <div className="header">
            <h2 className="header__title">Templates</h2>
            <div className="header__filter">
              <Input className="header__filter-item" value={ filter.search } onChange={ this.onSearchChange } />
              {
                Object.keys(tagCounts).length
                  ? <Dropdown className="header__filter-item" tagCounts={ tagCounts } tagsSelected={ tags } onChange={ this.onTagsChange } />
                  : null
              }
            </div>
          </div>

          <ul className="element-templates-list">
            {
              filteredElementTemplates.length
                ? filteredElementTemplates.map(elementTemplate => {
                  const { id } = elementTemplate;

                  return (
                    <ElementTemplatesListItem
                      key={ id }
                      applied={ applied }
                      expanded={ expanded }
                      elementTemplate={ elementTemplate }
                      onSelect={ () => this.onSelect(elementTemplate) }
                      onToggleExpanded={ () => this.onToggleExpanded(elementTemplate) }
                      selected={ selected } />
                  );
                })
                : null
            }
            {
              !filteredElementTemplates.length ? (
                <ElementTemplatesListItemEmpty />
              ) : null
            }
          </ul>
        </Modal.Body>

        <Modal.Footer>
          <div className="form-submit">
            <button className="btn btn-secondary" type="submit" onClick={ onClose }>
              Cancel
            </button>
            {
              true && (
                <button disabled={ isNil(selected) } className="btn btn-primary" type="submit" onClick={ this.onApply }>
                  Apply
                </button>
              )
            }
          </div>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default ElementTemplatesView;

export class ElementTemplatesListItem extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      applied,
      elementTemplate,
      expanded,
      onSelect,
      onToggleExpanded,
      selected
    } = this.props;

    const {
      description,
      id,
      name
    } = elementTemplate;

    let meta = [];

    const tags = getTags(elementTemplate),
          date = getDate(elementTemplate);

    // Assume first tag is catalog name
    if (tags.length) {
      meta = [
        ...meta,
        tags[ 0 ]
      ];
    }

    if (date) {
      meta = [
        ...meta,
        date
      ];
    }

    return (
      <li className={
        classNames(
          'element-templates-list__item',
          { 'element-templates-list__item--applied': id === applied },
          { 'element-templates-list__item--selectable': id !== applied },
          { 'element-templates-list__item--selected': id === selected }
        )
      } onClick={ id !== applied && id !== selected ? onSelect : null }>
        <div className="element-templates-list__item-header">
          <span className="element-templates-list__item-name">{ name }</span>
          {
            meta.length ? <span className="element-templates-list__item-meta">{ meta.join(' | ') }</span> : null
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
    return <li className="element-templates-list__item element-templates-list__item--empty">No matching catalog templates found.</li>;
  }
}

// helpers //////////

function filterElementTemplates(elementTemplates, filter) {
  return elementTemplates.filter(elementTemplate => {
    const {
      tags,
      search
    } = filter;

    const {
      description,
      name
    } = elementTemplate;

    // Assume first tag is Cawemo catalog project name
    if (tags && tags.length && !tags.includes(getTags(elementTemplate)[ 0 ])) {
      return false;
    }

    if (search
      && search.length
      && !name.toLowerCase().includes(search.toLowerCase())
      && !(description || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });
}

function getTags(elementTemplate) {
  const { metadata } = elementTemplate;

  if (!metadata) {
    return [];
  }

  const { tags } = metadata;

  if (!tags) {
    return [];
  }

  return tags;
}

function getTagCounts(elementTemplates) {
  return elementTemplates.reduce((tagCounts, elementTemplate) => {
    const tags = getTags(elementTemplate);

    tags.forEach(tag => {
      if (tagCounts[ tag ]) {
        tagCounts[ tag ] += 1;
      } else {
        tagCounts[ tag ] = 1;
      }
    });

    return tagCounts;
  }, {});
}

function getDate(elementTemplate) {
  const { metadata } = elementTemplate;

  if (!metadata) {
    return;
  }

  return new Date(metadata.updated).toLocaleDateString('en-US').split('/').reverse().join('-');
}