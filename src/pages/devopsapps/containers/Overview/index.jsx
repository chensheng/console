import React from 'react'
import { Link } from 'react-router-dom'
import { toJS } from 'mobx'
import { observer, inject } from 'mobx-react'
import { Icon } from '@kube-design/components'
import { Panel } from 'components/Base'
import Banner from 'components/Cards/Banner'

import { getDisplayName, getLocalTime } from 'utils'

import styles from './index.scss'

@inject('rootStore', 'devopsappStore')
@observer
class Overview extends React.Component {
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

  get workspace() {
    return this.props.match.params.workspace
  }

  renderBaseInfo() {
    const detail = this.store.data

    return (
      <Panel className={styles.wrapper} title={t('Basic Info')}>
        <div className={styles.header}>
          <Icon name="strategy-group" size={40} />
          <div className={styles.item}>
            <div>{getDisplayName(detail)}</div>
            <p>{t('DevOps Project')}</p>
          </div>
          <div className={styles.item}>
            <div>
              <Link to={`/workspaces/${this.workspace}`}>{this.workspace}</Link>
            </div>
            <p>{t('Workspace')}</p>
          </div>
          <div className={styles.item}>
            <div>{detail.creator || '-'}</div>
            <p>{t('Creator')}</p>
          </div>
          <div className={styles.item}>
            <div>
              {getLocalTime(detail.createTime).format(`YYYY-MM-DD HH:mm:ss`)}
            </div>
            <p>{t('Created Time')}</p>
          </div>
          <div className={styles.item}>
            <div>{detail.spec.git.repo}</div>
            <p>{t('GIT仓库')}</p>
          </div>
        </div>
      </Panel>
    )
  }

  render() {
    const { data } = toJS(this.store)

    return (
      <div>
        <Banner
          title={t('DevOps Basic Info')}
          icon="cdn"
          description={t('DEVOPS_DESCRIPTION')}
          module={this.module}
        />
        {this.renderBaseInfo()}
      </div>
    )
  }
}

export default Overview
