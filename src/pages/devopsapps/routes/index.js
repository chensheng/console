import { getIndexRoute } from 'utils/router.config'

import Layout from '../containers/layout'
import Overview from '../containers/Overview'
import DevopsAppsListLayout from '../containers/Base/List'
import PipelinesList from '../containers/Pipelines/PipelinesList'
import BaseInfo from '../containers/BaseInfo'
import Roles from '../containers/Roles'
import Members from '../containers/Members'
import Credential from '../containers/Credential'

import detail from './detail'

const PATH = '/:workspace/devopsapps/:devopsapp'

export default [
  {
    path: PATH,
    component: Layout,
    routes: [
      ...detail,
      {
        path: '',
        component: DevopsAppsListLayout,
        routes: [
          { path: `${PATH}/overview`, component: Overview, exact: true },
          { path: `${PATH}/base-info`, component: BaseInfo, exact: true },
          { path: `${PATH}/roles`, component: Roles, exact: true },
          { path: `${PATH}/members`, component: Members, exact: true },
          { path: `${PATH}/credentials`, component: Credential, exact: true },
          getIndexRoute({ path: PATH, to: `${PATH}/overview`, exact: true }),
        ],
      },
      getIndexRoute({ path: '*', to: '/404', exact: true }),
    ],
  },
]
