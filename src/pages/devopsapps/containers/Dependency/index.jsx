import React from 'react'
import { observer, inject } from 'mobx-react'
import { isEmpty, get, toUpper } from 'lodash'

import { Icon, Button } from '@kube-design/components'
import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class Dependency extends React.Component {

  state = {
    showSecret: false
  }

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

  get dependencies() {
    return this.envInfo.dependencies
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

  get enableActions() {
    return globals.app.getActions({
      module: 'applications',
      workspace: this.workspace,
      project: this.namespace,
      cluster: this.cluster
    })
  }

  toggleSecret = () => {
    this.setState({
      showSecret: !this.state.showSecret
    })
  }

  render() {
    const bannerProps = {
      title: t(`${this.envInfo.desc}`),
      description: `${t('应用依赖的组件信息，包括数据库、消息中间件、微服务等。')}`,
      icon: 'blockchain',
      module: this.module,
    }
    const { showSecret } = this.state
    const dependencies = this.dependencies

    return (
      <div>
        <Banner {...bannerProps} />
        {dependencies && dependencies.map((dependency, index) => (
          <Panel className={styles.wrapper} title={dependency.category} key={index}>
            <div className={styles.header}>
              {dependency.clusterUrl && (
               <div className={styles.item}>
                <div>{dependency.clusterUrl }</div>
                <p>{t('内部地址')}</p>
              </div>)}
              {dependency.url && (
              <div className={styles.item}>
                <div>{dependency.url}</div>
                <p>{t('外部地址')}</p>
              </div>)}
              {dependency.database && (
              <div className={styles.item}>
                <div>{dependency.database}</div>
                <p>{t('数据库')}</p>
              </div>)}
              {showSecret && dependency.username && (
              <div className={styles.item}>
                <div>{dependency.username}</div>
                <p>{t('Username')}</p>
              </div>)}
              {showSecret && dependency.password && (
              <div className={styles.item}>
                <div>{showSecret ? dependency.password : '******'}</div>
                <p>{t('password')}</p>
              </div>)}
              <Button type="flat" size="large" icon={showSecret ? 'eye-closed': 'eye'} onClick={this.toggleSecret}/>
            </div>
          </Panel>)
        )}
      </div>
    )
  }
}

export default Dependency
