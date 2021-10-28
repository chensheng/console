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

import React from 'react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import { sortBy, get } from 'lodash'

import { Form, Input, Select } from '@kube-design/components'
import { Modal } from 'components/Base'
import RevisionStore from 'stores/workload/revision'

@observer
export default class RollBackCustomModal extends React.Component {
  static propTypes = {
    visible: PropTypes.bool,
    detail: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
  }

  static defaultProps = {
    visible: false,
    detail: {},
    onOk() {},
    onCancel() {},
  }

  constructor(props) {
    super(props)

    this.revisionStore = new RevisionStore(props.store.module)

    this.form = React.createRef()
  }

  get revisions() {
    const { data, isLoading } = this.revisionStore.list
    return isLoading ? [] : data
  }

  get curRevision() {
    const { store, detail } = this.props

    return this.getCurrentRevision(detail, this.revisions, store.module)
  }

  componentDidMount() {
    if (this.props.visible) {
      this.fetchData(this.props.detail)
    }
  }

  fetchData = detail => {
    this.revisionStore.fetchList(detail)
  }

  getFormData = () => {
    const { name } = this.props.detail

    return {
      name,
      currentRevision: `${this.curRevision}`,
    }
  }

  getCurrentRevision = (workloadDetail, revisions, module = 'deployments') => {
    let revision = ''
  
    switch (module) {
      default:
      case 'deployments':
        revision = this.resolveImageTag(workloadDetail)
        break
      case 'statefulsets':
      case 'daemonsets': {
        let maxRevision = get(revisions[0], 'revision', 0)
        for (let i = 1; i < revisions.length; i++) {
          if (revisions[i].revision > maxRevision) {
            maxRevision = revisions[i].revision
          }
        }
  
        const cur = revisions.find(
          item => item.name === get(workloadDetail, 'status.currentRevision')
        )
        revision = cur ? cur.revision : maxRevision
        break
      }
    }
  
    return revision
  }

  resolveImageTag = (revisionItem) => {
    const image = get(revisionItem, 'spec.template.spec.containers[0].image')
    if (!image || image.indexOf(':') === -1) return null
    const imageUnits = image.split(':')
    const tag = imageUnits[imageUnits.length - 1]
    return tag
  }

  getRevisionOps = () => {
    const tagMap = {}
    const revisions = sortBy(this.revisions, item => {
      let sortWeight = 0
      const tag = this.resolveImageTag(item)
      if(!tag || tag.indexOf('-') === -1) return sortWeight

      const tagUnits = tag.split('-')
      try {
        sortWeight = parseInt(tagUnits[tagUnits.length - 1], 10)
      } catch(e) {}
      tagMap[sortWeight] = tag
      return -sortWeight
    })

    return revisions
      .map(({ revision }) => ({
        label: tagMap[revision],
        value: tagMap[revision],
      }))
      .filter(item => item.value && item.value !== this.curRevision)
  }

  handleOk = () => {
    const { detail, store, onOk } = this.props
    if (this.form && this.form.current) {
      const form = this.form.current
      form &&
        form.validate(() => {
          const formData = form.getData()

          const revision = this.revisions.find(item => {
            const imageTag = this.resolveImageTag(item)
            return imageTag === formData.revision
          })

          let data
          if (store.module === 'deployments') {
            data = [
              {
                op: 'replace',
                path: '/spec/template',
                value: toJS(get(revision, 'spec.template')),
              },
              {
                op: 'replace',
                path: '/metadata/annotations',
                value: detail.annotations,
              },
            ]
          } else {
            data = {
              spec: {
                template: {
                  $patch: 'replace',
                  ...toJS(get(revision, 'spec.template')),
                },
              },
            }
          }

          onOk(data)
        })
    }
  }

  render() {
    const { visible, onCancel, isSubmitting } = this.props
    const formData = this.getFormData()

    return (
      <Modal.Form
        formRef={this.form}
        data={formData}
        width={691}
        title={t('Revision Rollback')}
        icon="timed-task"
        onOk={this.handleOk}
        onCancel={onCancel}
        visible={visible}
        isSubmitting={isSubmitting}
      >
        <Form.Item label={t('Resource Name')}>
          <Input name="name" disabled />
        </Form.Item>
        <Form.Item label={t('Current Revision')}>
          <Input name="currentRevision" disabled />
        </Form.Item>
        <Form.Item
          label={t('Rollback Revisions')}
          rules={[
            {
              required: true,
              message: t('Please select rollback revision'),
            },
          ]}
        >
          <Select
            name="revision"
            placeholder={t('REVISION_ROLLBACK_SELECT')}
            options={this.getRevisionOps()}
          />
        </Form.Item>
      </Modal.Form>
    )
  }
}
