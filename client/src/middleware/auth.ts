import { createListenerMiddleware } from '@reduxjs/toolkit'
import { authApi } from '../app/services/auth';

////Создание функции перехвата токена 
export const listenerMiddleware = createListenerMiddleware()   //////// присвоили переменной вызов функции

listenerMiddleware.startListening({
    matcher: authApi.endpoints.login.matchFulfilled, ///// начни слушать authApi<т.е. когда залогинится> когда будет fulfilled 
    effect: async (action, listenerApi) => {         /////  запусти функцию
        listenerApi.cancelActiveListeners()

        if (action.payload.token) {                       /////////        если в payload будет токен
            localStorage.setItem('token', action.payload.token);   /////   запиши его в storage
        }
    },
})

