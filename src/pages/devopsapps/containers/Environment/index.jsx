import React from 'react'
import { observer, inject } from 'mobx-react'
import { isEmpty, get } from 'lodash'

import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'

import PodsCard from './PodsCard'
import WorkloadStore from 'stores/workload'
import ServiceStore from 'stores/service'
import Pipeline from './Pipeline'
import Service from './Service'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class Environment extends React.Component {
  workloadStore = new WorkloadStore('deployments')

  serviceStore = new ServiceStore()

  get routing() {
    return this.props.rootStore.routing
  }

  get store() {
    return this.props.devopsappStore
  }

  get devopsapp() {
    return this.props.match.params.devopsapp
  }

  get devopsappName() {
    return this.store.devopsappName
  }

  get environment() {
    return this.props.match.params.environment
  }

  get envInfo() {
    const { environments } = this.store.data.spec
    const currentEnv = this.environment
    for (const env of environments) {
      if (env.name === currentEnv) {
        return env
      }
    }
    return {}
  }

  get workspace() {
    return this.props.match.params.workspace
  }

  get cluster() {
    return this.envInfo.cluster
  }

  get namespace() {
    return `${this.environment}-${this.devopsapp}`
  }

  get pipeline() {
    return `pipeline-${this.envInfo.name}`
  }

  get currentRelease() {
    const { detail } = this.workloadStore
    const image = get(detail, 'spec.template.spec.containers[0].image')
    let currentRelease = t('None')
    if (image && image.indexOf(':') !== -1) {
      const items = image.split(':')
      currentRelease = items[items.length - 1]
    }
    return currentRelease
  }

  get enableActions() {
    return globals.app.getActions({
      module: 'applications',
      workspace: this.workspace,
      project: this.namespace,
      cluster: this.cluster
    })
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.match.params.environment !== this.props.match.params.environment
    ) {
      this.init()
    }
  }

  init = async () => {
    const params = {
      cluster: this.cluster,
      workspace: this.workspace,
      namespace: this.namespace,
    }
    await this.props.rootStore.getRules(params)

    this.serviceStore.detail = {}
    this.workloadStore.detail = {}
    this.fetchServiceData()
    this.fetchWorkloadData()
  }

  fetchServiceData = async () => {
    const params = {
      cluster: this.cluster,
      namespace: this.namespace,
      name: this.devopsapp,
    }
    await this.serviceStore.fetchDetail(params, true)
  }

  fetchWorkloadData = async () => {
    const params = {
      cluster: this.cluster,
      namespace: this.namespace,
      name: this.devopsapp,
    }
    await this.workloadStore.fetchDetail(params, true)
  }

  renderService() {
    const { detail } = this.serviceStore
    return (
      <Panel title={t('Service')}>
        {isEmpty(detail) || isEmpty(detail.ports) ? (
          <div className={styles.empty}>{t('RESOURCE_NOT_FOUND')}</div>
        ) : (
          <Service cluster={this.cluster} detail={detail} workloadDetail={this.workloadStore.detail} gateway={this.envInfo.gateway}/>
        )}
      </Panel>
    )
  }

  renderPods() {
    const { detail } = this.workloadStore
    if (isEmpty(detail)) {
      return (
        <Panel title={t('Pods')}>
          <div className={styles.empty}>{t('RESOURCE_NOT_FOUND')}</div>
        </Panel>
      )
    }

    return (
      <PodsCard
        title={`${t('Pods')} (${this.envInfo.resource.cpu}核${this.envInfo.resource.memory})`}
        prefix={`/${this.workspace}/clusters/${this.envInfo.cluster}`}
        detail={detail}
        hideHeader={false}
        hideFooter={true}
        rootStore={this.props.rootStore}
        workloadStore={this.workloadStore}
        enableActions={this.enableActions}
      />
    )
  }

  renderPipeline() {
    return (
      <Pipeline
        title={`发布记录`}
        workspace={this.workspace}
        cluster={this.cluster}
        devopsName={this.devopsapp}
        pipeline={this.pipeline}
        enableActions={this.enableActions}
      />
    )
  }

  render() {
    const bannerProps = {
      title: t(`${this.envInfo.desc}`),
      description: `${t('Versions')}：${this.currentRelease}`,
      icon: 'cdn',
      module: this.module,
    }

    return (
      <div>
        <Banner {...bannerProps} />
        {this.renderService()}
        {this.renderPods()}
        {this.renderPipeline()}
      </div>
    )
  }
}

export default Environment
