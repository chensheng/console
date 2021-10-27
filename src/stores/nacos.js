import { isEmpty } from 'lodash'
import { observable, action } from 'mobx'
import { Notify } from '@kube-design/components'

export default class NacosStore {
  @observable
  isLoading = false

  @observable
  isEditing = false

  @observable
  configContent = ''

  @action
  async fetchConfig(
    nacosInfo = { url, username, password },
    params = { tenant, dataId, group }
  ) {
    this.isLoading = true
    const url = 'nacos/v1/cs/configs'
    const headers = {
      'nacos-url': nacosInfo.url,
      'nacos-username': nacosInfo.username,
      'nacos-password': nacosInfo.password,
    }

    let result, error
    for(let i = 0; i < 5; i++) {
      error = null
      result = await request.get(url, params, { headers }, e => {
        error = e
      })
      if(!error) {
        break
      }
    }
    if(error) {
      Notify.error(t('Error Tips'), t(error.message))
    }

    this.configContent = result || ''
    this.isLoading = false
    return result
  }

  @action
  async saveConfig(
    nacosInfo = { url, username, password },
    params = { tenant, dataId, group, content, type }
  ) {
    if(isEmpty(params.content)) {
      Notify.error('Error Tips', t('Please input value'))
      this.fetchConfig(nacosInfo, params)
      return
    }

    this.isLoading = true
    const url = 'nacos/v1/cs/configs'
    const headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'nacos-url': nacosInfo.url,
      'nacos-username': nacosInfo.username,
      'nacos-password': nacosInfo.password,
    }

    await request.post(url, params, { headers }, error => {
      Notify.error(t('Error Tips'), t(error.message))
    })
    this.isLoading = false
  }

  @action
  reset() {
    this.isEditing = false
    this.configContent = ''
  }
}
