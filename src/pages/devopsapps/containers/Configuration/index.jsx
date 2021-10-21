import React from 'react'
import { observer, inject } from 'mobx-react'
import { isEmpty, get } from 'lodash'

import { Tag } from '@kube-design/components'
import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'

import NacosStore from 'stores/nacos'


@inject('rootStore', 'devopsappStore')
@observer
class Configuration extends React.Component {
  nacosStore = new NacosStore()

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

  get configCenter() {
    const { configCenter } = this.store.data.spec
    return configCenter ? configCenter : {}
  }

  get workspace() {
    return this.props.match.params.workspace
  }

  get cluster() {
    return this.envInfo.cluster
  }

  get namespace() {
    return `${this.envInfo.name}-${this.devopsapp}`
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.environment !== this.props.match.params.environment) {
      this.init()
    }
  }

  init = async () => {
    const nacosInfo = {
      url: this.configCenter.url,
      username: this.configCenter.username,
      password: this.configCenter.password,
    }
    const params = {
      tenant: this.environment,
      dataId: this.devopsapp,
      group: 'DEFAULT_GROUP'
    }
    this.nacosStore.configContent = ''
    this.nacosStore.fetchDetail(nacosInfo, params)
  }

  render() {
    const bannerProps = {
      title: t(`${this.envInfo.desc}`),
      description: `${t('Nacos配置项服务')}`,
      icon: 'cdn',
      module: this.module,
    }

    return (
      <div>
        <Banner {...bannerProps} />
        <div>{this.nacosStore.configContent}</div>
      </div>
    )
  }
}

export default Configuration
