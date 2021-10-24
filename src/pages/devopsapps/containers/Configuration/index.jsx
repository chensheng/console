import React from 'react'
import { observer, inject } from 'mobx-react'
import { isEmpty, get } from 'lodash'

import { Icon, Button } from '@kube-design/components'
import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'
import { CodeEditor } from 'components/Base'

import NacosStore from 'stores/nacos'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class Configuration extends React.Component {
  nacosStore = new NacosStore()

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

  get configCenter() {
    let configCenter = {}
    
    const globalConfigCenter = this.store.data.spec.configCenter
    const envConfigCenter = this.envInfo.configCenter
    globalConfigCenter && (configCenter = {...globalConfigCenter})
    envConfigCenter && (configCenter = {...configCenter, ...envConfigCenter})
    
    return configCenter
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

  get nacosGroup() {
    return 'DEFAULT_GROUP'
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
      group: this.nacosGroup
    }
    this.setState({showSecret: false})
    this.nacosStore.reset()
    this.nacosStore.fetchConfig(nacosInfo, params)
  }

  handleEdit = () => {
    this.nacosStore.isEditing = true
  }

  handleSave = () => {
    this.nacosStore.isEditing = false
    const nacosInfo = {
      url: this.configCenter.url,
      username: this.configCenter.username,
      password: this.configCenter.password,
    }
    const params = {
      tenant: this.environment,
      dataId: this.devopsapp,
      group: this.nacosGroup,
      type: 'yaml',
      content: this.nacosStore.configContent
    }
    this.nacosStore.saveConfig(nacosInfo, params)
  }

  handleChange = value => {
    this.nacosStore.configContent = value
  }

  toggleSecret = () => {
    this.setState({
      showSecret: !this.state.showSecret
    })
  }

  renderBaseInfo() {
    const { url, clusterUrl, username, password } = this.configCenter
    const { showSecret } = this.state
    const nacosUrl = clusterUrl ? clusterUrl : url

    return (
      <Panel className={styles.wrapper} title={t('连接信息')}>
        <div className={styles.header}>
          <Icon name="link" size={40} />
          <div className={styles.item}>
            <div>{nacosUrl.replace('http://', '').replace('https://')}</div>
            <p>{t('Address')}</p>
          </div>
          <div className={styles.item}>
            <div>{username}</div>
            <p>{t('Username')}</p>
          </div>
          <div className={styles.item}>
            <div>{showSecret ? password : '******'}</div>
            <p>{t('password')}</p>
          </div>
          <div className={styles.item} style={{display: showSecret?'block':'none'}}>
            <div>{this.environment}</div>
            <p>{t('tenant')}</p>
          </div>
          <div className={styles.item} style={{display: showSecret?'block':'none'}}>
            <div>{this.devopsapp}</div>
            <p>{t('dataId')}</p>
          </div>
          <div className={styles.item} style={{display: showSecret?'block':'none'}}>
            <div>{this.nacosGroup}</div>
            <p>{t('group')}</p>
          </div>
          <Button type="flat" icon={showSecret ? 'eye-closed': 'eye'} onClick={this.toggleSecret}/>
        </div>
      </Panel>
    )
  }

  renderEditButton() {
    const { isLoading, isEditing, configContent } = this.nacosStore;
    if(!this.enableActions.includes('edit')) {
      return <div></div>
    }

    if(isEditing) {
      return  (
        <div className={styles.ops}>
          <Icon
            name="check"
            size={20}
            clickable
            color={{ primary: '#fff', secondary: '#fff' }}
            onClick={this.handleSave}
          />
        </div>
      )
    }

    return (
      <div className={styles.ops}>
        <Icon
          name="pen"
          size={20}
          clickable
          color={{ primary: '#fff', secondary: '#fff' }}
          onClick={this.handleEdit}
        />
       </div>
    )
  }

  renderEditor() {
    const { isLoading, isEditing, configContent } = this.nacosStore;

    const editorOptions = {
      readOnly: !isEditing,
      theme: 'github',
      showGutter: isEditing,
      highlightActiveLine: isEditing
    }

    return (
      <Panel title={t('配置详情')} className={styles.configWrapper} loading={isLoading}>
        <div className={styles.codeEditor}>
          {this.renderEditButton()}
          <CodeEditor
            mode='yaml'
            value={configContent}
            options={editorOptions}
            onChange={this.handleChange}
          />
        </div>
      </Panel>
    )
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
        {this.renderBaseInfo()}
        {this.renderEditor()}
      </div>
    )
  }
}

export default Configuration
