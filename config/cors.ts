import type { CorsConfig } from '@ioc:Adonis/Core/Cors'

const corsConfig: CorsConfig = {
<<<<<<< HEAD
  enabled: true,
  origin: '*',
  methods: ['GET', 'HEAD', 'POST', 'PUT','PATCH', 'DELETE'],
  headers: true,
=======

  enabled: true,

  origin: true,

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],

  headers: true,

>>>>>>> development
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ],
  credentials: true,
  maxAge: 90,
}

export default corsConfig
