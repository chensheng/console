import { getIndexRoute } from 'utils/router.config'

import Layout from '../containers/layout'
import ListLayout from '../containers/Base/List'
import Overview from '../containers/Overview'
import Environment from '../containers/Environment'
import Configuration from '../containers/Configuration'
import Dependency from '../containers/Dependency'
import AlertingMessages from '../containers/Alerting/Messages'
import AlertingPolicies from '../containers/Alerting/Policies'


const PATH = '/:workspace/devopsapps/:devopsapp'

export default [
  {
    path: PATH,
    component: Layout,
    routes: [
      {
        path: '',
        component: ListLayout,
        routes: [
          { path: `${PATH}/overview`, component: Overview, exact: true },
          { path: `${PATH}/environments/:environment`, component: Environment, exact: true},
          { path: `${PATH}/configurations/:environment`, component: Configuration, exact: true},
          { path: `${PATH}/dependencies/:environment`, component: Dependency, exact: true },
          { path: `${PATH}/alerts`, component: AlertingMessages, exact: true},
          { path: `${PATH}/alert-rules`, component: AlertingPolicies, exact: true},
          getIndexRoute({ path: PATH, to: `${PATH}/overview`, exact: true }),
        ],
      },
      getIndexRoute({ path: '*', to: '/404', exact: true }),
    ],
  },
]
