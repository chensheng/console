/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import { get } from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { toJS } from 'mobx'
import { inject, observer } from 'mobx-react'
import {
  Button,
  RadioGroup,
  InputSearch,
  Columns,
  Column,
} from '@kube-design/components'
import { Modal, ScrollLoad } from 'components/Base'

import WorkspaceStore from 'stores/workspace'
import DevOpsAppStore from 'stores/devopsapp'

import Card from './Card'

import styles from './index.scss'

@inject('rootStore')
@observer
export default class DevOpsAppSelectModal extends React.Component {
  constructor(props) {
    super(props)

    this.store = new WorkspaceStore()
    this.devopsappStore = new DevOpsAppStore()

    this.stores = {
      devopsapps: this.devopsappStore,
    }

    this.state = {
      type: props.defaultType || 'devopsapps',
      search: '',
    }
  }

  componentDidMount() {
    this.store.fetchDetail({ workspace: this.props.workspace })
  }

  get types() {
    const types = [
      {
        label: t('DevOps应用'),
        value: 'devopsapps',
      },
    ]

    return types
  }

  fetchData = query => {
    const { workspace } = this.props
    const { search } = this.state
    const params = { workspace, ...query }

    if (search) {
      params.name = search
    }

    this.stores[this.state.type].fetchList(params)
  }

  handleSearch = name => {
    this.setState({ search: name }, this.fetchData)
  }

  handleRefresh = () => this.fetchData()

  handleTypeChange = type => {
    if (this.state.type !== type) {
      this.setState({ type, search: '' }, this.fetchData)
    }
  }

  handleEnterWorkspace = () => {
    const { workspace, onChange } = this.props
    return onChange(`/workspaces/${workspace}`)
  }

  handleOnEnter = item => {
    const { workspace, onChange } = this.props
    if (this.state.type === 'devopsapps') {
      onChange(`/${workspace}/devopsapps/${item.name}`)
    }
  }

  render() {
    const { visible, workspace, onCancel } = this.props
    const { type } = this.state
    const { detail } = this.store
    const list = this.stores[type].list
    const { data, total, page, isLoading } = toJS(list)

    return (
      <Modal
        bodyClassName={styles.body}
        visible={visible}
        onCancel={onCancel}
        width={960}
        icon="enterprise"
        title={<a onClick={this.handleEnterWorkspace}>{workspace}</a>}
        description={get(detail, 'description') || t('Workspace')}
        hideFooter
      >
        <div className={styles.bar}>
          <Columns className="is-variable is-1">
            <Column className="is-narrow">
              <RadioGroup
                mode="button"
                value={type}
                options={this.types}
                onChange={this.handleTypeChange}
              />
            </Column>
            <Column>
              <div className={styles.searchWrapper}>
                <InputSearch
                  className={classNames(styles.search, {
                    [styles.withSelect]: false,
                  })}
                  value={this.state.search}
                  placeholder={t('Search by name')}
                  onSearch={this.handleSearch}
                />
              </div>
            </Column>
            <Column className="is-narrow">
              <div>
                <Button
                  icon="refresh"
                  type="flat"
                  onClick={this.handleRefresh}
                />
              </div>
            </Column>
          </Columns>
        </div>
        <div className={styles.list}>
          <ScrollLoad
            wrapperClassName={styles.listWrapper}
            data={data}
            total={total}
            page={page}
            loading={isLoading}
            onFetch={this.fetchData}
          >
            {data.map(item => (
              <Card
                key={item.uid || item.devops}
                data={item}
                type={type}
                onEnter={this.handleOnEnter}
              />
            ))}
          </ScrollLoad>
        </div>
      </Modal>
    )
  }
}
