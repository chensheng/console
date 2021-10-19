import React from 'react'
import { observer, inject } from 'mobx-react'
import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'
import PodsCard from 'components/Cards/Pods'
import Service from './Service'
import Pipeline from './Pipeline'

import { isEmpty } from 'lodash'

import WorkloadStore from 'stores/workload'
import ServiceStore from 'stores/service'
import DevopsStore from 'stores/devops'
import PipelineStore from 'stores/devops/pipelines'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class Environment extends React.Component {
  workloadStore = new WorkloadStore('deployments')
  serviceStore = new ServiceStore();
  devopsStore = new DevopsStore();
  pipelineStore = new PipelineStore();

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

  get cluster() {
    return this.envInfo.cluster
  }

  get devops() {
    return this.devopsStore.devops
  }

  get pipeline() {
    return `pipeline-${this.envInfo.name}`
  }

  componentDidMount() {
    localStorage.setItem('pipeline-activity-detail-referrer', location.pathname)
    this.init()
    this.fetchServiceData()
    this.fetchWorkloadData()
    this.fetchDevopsData()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.environment !== this.props.match.params.environment) {
      this.serviceStore.detail = {}
      this.workloadStore.detail = {}
      this.fetchServiceData()
      this.fetchWorkloadData()
      this.fetchDevopsData()
    }
  }

  init = async () => {
    const params = {
      cluster: this.envInfo.cluster,
      workspace: this.workspace,
      namespace: `${this.envInfo.name}-${this.devopsapp}`,
      name: this.devopsapp
    }
    await this.props.rootStore.getRules(params)
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

  fetchDevopsData = async () => {
    const params = {
      cluster: this.envInfo.cluster,
      workspace: this.workspace,
      name: this.devopsapp
    }
    await this.devopsStore.fetchDetailByName(params)

    const activityParams = {
      name: `pipeline-${this.envInfo.name}`,
      devops: this.devopsStore.devops,
      cluster: this.envInfo.cluster,
    }
    await this.pipelineStore.getActivities(activityParams)
  }

  renderService() {
    const detail = this.serviceStore.detail

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

    return <PodsCard title={`Pods`} prefix={`/${this.workspace}/clusters/${this.envInfo.cluster}`} detail={detail} hideHeader={true} hideFooter={true} />
  }

  renderDevops() {
    const { activityList, detail } = this.pipelineStore
    const prefix = `/${this.workspace}/clusters/${this.cluster}/devops/${this.devops}/pipelines/${this.pipeline}`
    return (<Pipeline title={`发布记录`} prefix={prefix} detail={detail} activityList={activityList}/>)
  }

  render() {
    const { data } =this.store
    const envInfo = this.envInfo

    return (
      <div>
        <Banner
          title={t(`${envInfo.desc}`)}
          icon="cdn"
          module={this.module}
        />
        {this.renderService()}
        {this.renderPods()}
        {this.renderDevops()}
      </div>
    )
  }
}

export default Environment
