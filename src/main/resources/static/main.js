import login from './apis/login.js'
import logout from './apis/logout.js'
import getStatus from './apis/getStatus.js'
import refreshToken from './apis/refreshToken.js'
import expireAccessToken from './apis/expireAccessToken.js'
import expireRefreshToken from './apis/expireRefreshToken.js'
import mockRequest from './apis/mockRequest.js'

const { createApp, reactive, computed, watch, onMounted, onUnmounted } = Vue

const ACCESS_TOKEN = 'AccessToken'
const REFRESH_TOKEN = 'RefreshToken'

const App = {
    template: `
      <div class="border-box h-screen" style="padding: 1rem;">
      <div>密码模式（Resource Owner Password Credentials Grant）</div>
      <hr>
      <template v-if="!state.documentLoading">
        <div v-if="!loggedIn">
          账号：root <br>
          密码：password <br>
          <button @click="onClickLogin" style="margin-top: .25rem;" type="button" data-type="primary" is="ui-button">
            登陆
          </button>
        </div>
        <div v-else>
          已登陆，账号：root
          <br>
          <button @click="onClickLogout"
                  style="margin-top: .25rem;" type="button" data-type="danger" is="ui-button">
            登出
          </button>
          <hr>
          <div style="margin-top: .25rem;">
            <button @click="onClickExpireAccessToken" class="ui-button">使AccessToken失效</button>
            <button @click="onClickExpireRefreshToken" style="margin-left: .25rem" class="ui-button">
              使RefreshToken失效
            </button>
            <button @click="onClickAsynchronousRequest" style="margin-left: .25rem" class="ui-button">发起多个异步请求</button>
          </div>
          <template v-if="state.mockData.length">
            <hr>
            <div>
              <div v-for="(data, index) of state.mockData" :key="index">
                {{ index }}: {{ data }}
              </div>
            </div>
          </template>
        </div>
      </template>
      </div>
    `,
    setup(props) {
        const state = reactive({
            accessToken: localStorage.getItem(ACCESS_TOKEN) || '',
            refreshToken: localStorage.getItem(REFRESH_TOKEN) || '',
            documentLoading: false,
            mockData: [],
        })

        watch(() => state.documentLoading, (loading) => {
            document.loading = loading
        })

        watch(() => state.accessToken, (newAccessToken) => {
            if (localStorage.getItem(ACCESS_TOKEN) === newAccessToken) {
                return
            }
            localStorage.setItem(ACCESS_TOKEN, newAccessToken)
        })

        watch(() => state.refreshToken, (newRefreshToken) => {
            if (localStorage.getItem(REFRESH_TOKEN) === newRefreshToken) {
                return
            }
            localStorage.setItem(REFRESH_TOKEN, newRefreshToken)
        })

        const loggedIn = computed(() => {
            return state.accessToken
        })

        async function onClickLogin(ev) {
            try {
                ev.target.classList.add('loading')
                const { accessToken, refreshToken } = await login({
                    username: 'root',
                    password: 'password',
                })
                state.accessToken = accessToken
                state.refreshToken = refreshToken
                LightTip.success('登录成功')
                //
                await mockMultipleAsynchronousRequests()
            } catch (err) {
                LightTip.error(err.message)
            } finally {
                ev.target.classList.remove('loading')
            }
        }

        async function onClickLogout(ev) {
            try {
                ev.target.classList.add('loading')
                await logout({
                    accessToken: state.accessToken,
                })
                state.accessToken = ''
                state.refreshToken = ''
                LightTip.success('登出成功')
            } catch (err) {
                LightTip.error(err.message)
            } finally {
                ev.target.classList.remove('loading')
            }
        }

        const afterRefreshedTaskList = []
        afterRefreshedTaskList.debounceTime = 0

        async function refreshAccessToken() {
            if (!state.refreshToken) {
                return
            }
            try {
                const { accessToken } = await refreshToken({ refreshToken: state.refreshToken })
                state.accessToken = accessToken
                LightTip.success('刷新Token成功')
                if (afterRefreshedTaskList.length) {
                    const tasks = [...afterRefreshedTaskList]
                    afterRefreshedTaskList.length = 0
                    await Promise.all(tasks.map(it => it()))
                }
            } catch (err) {
                state.accessToken = ''
                state.refreshToken = ''
                LightTip.error(err.message)
            }
        }

        async function mockSingleRequest() {
            try {
                const accessToken = state.accessToken
                const { data } = await mockRequest({ accessToken })
                state.mockData.push(data)
            } catch (err) {
                if (err.status === 401) {
                    const now = new Date().getTime()
                    if (now - afterRefreshedTaskList.debounceTime > 10_000) {
                        afterRefreshedTaskList.debounceTime = new Date().getTime()
                        afterRefreshedTaskList.push(() => mockSingleRequest())
                        await refreshAccessToken()
                    } else if (afterRefreshedTaskList.length) {
                        afterRefreshedTaskList.push(() => mockSingleRequest())
                    } else {
                        await mockSingleRequest()
                    }
                } else {
                    LightTip.error(err.message)
                }
            }
        }

        async function mockMultipleAsynchronousRequests() {
            await Promise.all([
                mockSingleRequest(),
                mockSingleRequest(),
                mockSingleRequest(),
                mockSingleRequest(),
                mockSingleRequest(),
            ])
        }

        onMounted(async () => {
            try {
                state.documentLoading = true
                if (!state.accessToken) {
                    return
                }
                const { isLoggedIn } = await getStatus({ accessToken: state.accessToken })
                if (!isLoggedIn) {
                    afterRefreshedTaskList.push(() => mockMultipleAsynchronousRequests())
                    await refreshAccessToken()
                } else {
                    await mockMultipleAsynchronousRequests()
                }
            } finally {
                state.documentLoading = false
            }
        })

        function synchronousStorageToState(ev) {
            const { key, newValue } = ev
            if (key === ACCESS_TOKEN && state.accessToken !== newValue) {
                state.accessToken = newValue
            }
            if (key === REFRESH_TOKEN && state.refreshToken !== newValue) {
                state.refreshToken = newValue
            }
        }

        onMounted(() => window.addEventListener('storage', synchronousStorageToState))
        onUnmounted(() => window.removeEventListener('storage', synchronousStorageToState))

        async function onClickExpireAccessToken(ev) {
            try {
                ev.target.classList.add('loading')
                await expireAccessToken({ accessToken: state.accessToken })
                LightTip.success('服务端AccessToken已失效')
            } catch (err) {
                LightTip.error(err.message)
            } finally {
                ev.target.classList.remove('loading')
            }
        }

        async function onClickExpireRefreshToken(ev) {
            try {
                ev.target.classList.add('loading')
                await expireRefreshToken({ accessToken: state.accessToken })
                LightTip.success('服务端RefreshToken已失效')
            } catch (err) {
                LightTip.error(err.message)
            } finally {
                ev.target.classList.remove('loading')
            }
        }

        async function onClickAsynchronousRequest(ev) {
            try {
                ev.target.classList.add('loading')
                await mockMultipleAsynchronousRequests()
                LightTip.success('请求成功')
            } catch (err) {
                LightTip.error(err.message)
            } finally {
                ev.target.classList.remove('loading')
            }
        }

        return {
            state,
            loggedIn,
            onClickLogin,
            onClickLogout,
            onClickExpireAccessToken,
            onClickExpireRefreshToken,
            onClickAsynchronousRequest
        }
    },
}

createApp(App).mount('#app')