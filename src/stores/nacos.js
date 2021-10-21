import { get, set, uniq, isArray, intersection } from 'lodash'
import { observable, action } from 'mobx'

export default class NacosStore {
    @observable
    isLoading = false  
    
    @observable
    configContent = ''
    
    @action
    async fetchDetail(nacosInfo = { url, username, password }, params = { tenant, dataId, group }) {
        this.isLoading = true
        const url = `nacos/v1/cs/configs`
        const headers = {
            'nacos-url': nacosInfo.url,
            'nacos-username': nacosInfo.username,
            'nacos-password': nacosInfo.password
        }
        
        const result = await request.get(url, params, {headers})
        this.configContent = result
        this.isLoading = false
        return result
    }
}