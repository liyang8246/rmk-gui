export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client && !from.name && to.path !== '/') {
    return navigateTo('/')
  }
})
