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

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { toJS } from 'mobx'
import { Button } from '@kube-design/components'
import { Panel } from 'components/Base'
import Table from 'components/Tables/List'
import EmptyCard from 'devops/components/Cards/EmptyCard'
import Status from 'devops/components/Status'

import { getLocalTime, formatUsedTime } from 'utils'
import { getPipelineStatus } from 'utils/status'
import { get, isEmpty, omit, isArray } from 'lodash'

export default class Pipeline extends Component {
  static propTypes = {
    title: PropTypes.string,
    detail: PropTypes.object,
    activityList: PropTypes.object,
    branch: PropTypes.string,
    prefix: PropTypes.string
  }

  static defaultProps = {
    title: '',
    detail: {},
    activityList: {},
    branch: null,
    prefix: ''
  }

  get prefix() {
    return this.props.prefix
  }

  getRunhref = record => {
    const matchArray = get(record, '_links.self.href', '').match(
      /\/pipelines\/\S*?(?=\/)\/branches\/(\S*?(?=\/)?)\//
    )
    if (isArray(matchArray)) {
      return `${this.prefix}/branch/${record.pipeline}/run/${record.id}`
    }
    return `${this.prefix}/run/${record.id}`
  }

  getColumns = () => [
    {
      title: t('Status'),
      width: '15%',
      key: 'status',
      render: record => (
        <Link className="item-name" to={this.getRunhref(record)}>
          <Status {...getPipelineStatus(record)} />
        </Link>
      ),
    },
    {
      title: t('Run'),
      width: '10%',
      key: 'run',
      render: record => (
        <Link className="item-name" to={this.getRunhref(record)}>
          {record.id}
        </Link>
      ),
    },
    {
      title: t('Commit'),
      dataIndex: 'commitId',
      width: '10%',
      render: commitId => (commitId && commitId.slice(0, 6)) || '-',
    },
    ...(this.props.branch
      ? []
      : [
          {
            title: t('Branch'),
            width: '15%',
            key: 'branch',
            render: record => {
              const matchArray = get(record, '_links.self.href', '').match(
                /\/pipelines\/\S*?(?=\/)\/branches\/(\S*?(?=\/)?)\//
              )
              if (isArray(matchArray)) {
                return (
                  <Link
                    className="item-name"
                    to={`${this.prefix}/branch/${record.pipeline}/activity`}
                  >
                    <ForkIcon style={{ width: '20px', height: '20px' }} />{' '}
                    {decodeURIComponent(record.pipeline)}
                  </Link>
                )
              }
              return '-'
            },
          },
        ]),
    {
      title: t('Last Message'),
      dataIndex: 'causes',
      width: '25%',
      render: causes => get(causes, '[0].shortDescription', ''),
    },
    {
      title: t('Duration'),
      dataIndex: 'durationInMillis',
      width: '10%',
      render: durationInMillis =>
        durationInMillis ? formatUsedTime(durationInMillis) : '-',
    },
    {
      title: t('Updated Time'),
      dataIndex: 'startTime',
      width: '20%',
      render: time => getLocalTime(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      isHideable: false,
      width: '10%',
      key: 'action',
      render: record => {
        if (
          (record.branch && !record.commitId) 
          //||!this.enabledActions.includes('edit')
        ) {
          return null
        }
        if (record.state === 'FINISHED') {
          return (
            <Button
              //onClick={this.handleReplay(record)}
              icon="restart"
              type="flat"
            />
          )
        }
        return (
          <Button 
          //onClick={this.handleStop(record)} 
          icon="stop" type="flat" />
        )
      },
    },
  ]

  getActions = () =>
    [
          {
            type: 'control',
            key: 'run',
            text: t('Run'),
            action: 'edit',
            //onClick: this.handleRunning,
          },
        ]

  render() {
    const { title, activityList } = this.props
    const { data, isLoading, total, page, limit, filters } = activityList
    const omitFilters = omit(filters, 'page', 'workspace')
    const pagination = { total, page, limit }
    const isEmptyList = total === 0

    if (isEmptyList) {
      const runnable = true
      const isMultibranch = false
      const isBranchInRoute = false

      if (isMultibranch && !isEmpty(isMultibranch) && !isBranchInRoute) {
        return (
          <Panel title={t(title)}>
            <EmptyCard desc={t('Pipeline config file not found')}>
              {runnable && (
                <Button type="control">
                  {t('Scan Repository')}
                </Button>
              )}
            </EmptyCard>
          </Panel>
        )
      }

      return (
        <Panel title={t(title)}>
        <EmptyCard desc={t('暂无发布记录')}>
          {runnable && (
            <Button type="control">
              {t('马上发布')}
            </Button>
          )}
        </EmptyCard>
        </Panel>
      )
    }

    const rowKey = get(data[0], 'time') ? 'time' : 'endTime'

    return (
      <Panel title={t(title)}>
        <Table
          data={toJS(data)}
          columns={this.getColumns()}
          rowKey={rowKey}
          filters={omitFilters}
          pagination={pagination}
          isLoading={isLoading}
          onFetch={this.handleFetch}
          actions={this.getActions()}
          //footer={this.renderFooter()}
          hideSearch
          hideHeader
          enabledActions={['edit']}
        />
      </Panel>
    )
  }
}
