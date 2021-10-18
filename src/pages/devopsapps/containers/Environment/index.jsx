import React from 'react'
import { Link } from 'react-router-dom'
import { toJS } from 'mobx'
import { observer, inject } from 'mobx-react'
import { Icon } from '@kube-design/components'
import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'
import PodsCard from 'components/Cards/Pods'
import Ports from 'projects/containers/Services/Detail/Ports'
import Service from './Service'

import { getDisplayName, getLocalTime } from 'utils'
import { isEmpty } from 'lodash'

import WorkloadStore from 'stores/workload'
import ServiceStore from 'stores/service'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class Environment extends React.Component {
  workloadStore = new WorkloadStore('deployments')
  serviceStore = new ServiceStore();

  get routing() {
    return this.props.rootStore.routing
  }

  get store() {
    return this.props.devopsappStore
  }

  get workspace() {
    return this.props.match.params.workspace
  }

  get devopsapp() {
    return this.props.match.params.devopsapp
  }

  get environment() {
    return this.props.match.params.environment
  }

  get devopsappName() {
    return this.store.devopsappName
  }

  get envInfo() {
    const { environments } = this.store.data.spec
    const currentEnv = this.environment
    for(let env of environments) {
      if(env.name === currentEnv) {
        return env
      }
    }
    return {}
  }

  componentDidMount() {
    this.fetchServiceData()
    this.fetchWorkloadData()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.environment !== this.props.match.params.environment) {
      this.serviceStore.detail = {}
      this.workloadStore.detail = {}
      this.fetchServiceData()
      this.fetchWorkloadData()
    }
  }

  fetchServiceData = async () => {
    const params = {
      cluster: this.envInfo.cluster,
      workspace: this.workspace,
      namespace: `${this.envInfo.name}-${this.devopsapp}`,
      name: this.devopsapp
    }
    await this.serviceStore.fetchDetail(params)
  }

  fetchWorkloadData = async () => {
    const params = {
      cluster: this.envInfo.cluster,
      workspace: this.workspace,
      namespace: `${this.envInfo.name}-${this.devopsapp}`,
      name: this.devopsapp
    }
    await this.workloadStore.fetchDetail(params)
  }

  renderPorts() {
    const detail = toJS(this.serviceStore.detail)

    return (
      <Panel title={t('Service')}>
        {isEmpty(detail) ? (<div className={styles.empty}>{t('RESOURCE_NOT_FOUND')}</div>)
        : <Service detail={detail} />}
      </Panel>
    )
  }

  renderPods() {
    const detail = this.workloadStore.detail
    if(isEmpty(detail)) {
      return (
        <Panel title={t('Pods')}>
          <div className={styles.empty}>{t('RESOURCE_NOT_FOUND')}</div>
        </Panel>
      )
    }

    return <PodsCard title={`Pods`} prefix={`/${this.workspace}/clusters/${this.envInfo.cluster}`} detail={detail} hideHeader={true} hideFooter={false} />
  }

  render() {
    const { data } =this.store
    const envInfo = this.envInfo

    return (
      <div>
        <Banner
          title={t(`${envInfo.name}`)}
          icon="cdn"
          description={t(`${envInfo.desc}`)}
          module={this.module}
        />
        {this.renderPorts()}
        {this.renderPods()}
      </div>
    )
  }
}

export default Environment
