import { get, set, uniq, isArray, intersection } from 'lodash'
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

    const result = await request.get(url, params, { headers }, error => {
      Notify.error(t('Error Tips'), t(error.message))
    })
    this.configContent = result || ''
    this.isLoading = false
    return result
  }

  @action
  async saveConfig(
    nacosInfo = { url, username, password },
    params = { tenant, dataId, group, content, type }
  ) {
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
