Quero que cries uma aplicação web profissional de partilha de ecrã em tempo real.

NOME TEMPORÁRIO:
ScreenRoom

OBJETIVO PRINCIPAL

Criar uma aplicação semelhante a uma versão simplificada de Discord Screen Share / Google Meet, focada principalmente em partilha de ecrã.

Um utilizador deve poder:

1. criar uma sala;
2. iniciar a partilha do seu ecrã;
3. receber um link exclusivo da sala;
4. enviar esse link para outras pessoas;
5. permitir que convidados entrem na sala;
6. permitir que convidados assistam à transmissão em tempo real;
7. controlar quem pode assistir;
8. terminar a transmissão;
9. expulsar participantes;
10. proteger salas com senha opcional.

A aplicação deve ser moderna, rápida, responsiva, segura e preparada para produção.

==================================================
STACK
==================================================

Frontend:

- Next.js latest stable
- App Router
- React
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Lucide Icons

Backend:

- Node.js
- Next.js Route Handlers ou backend modular separado
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod para validação

Realtime / Streaming:

- WebRTC
- LiveKit
- LiveKit Client SDK
- LiveKit Server SDK

Autenticação:

- Auth.js

Pode suportar inicialmente:

- email/password
- Google OAuth opcional

Segurança:

- cookies HTTP-only
- Secure cookies em produção
- SameSite
- CSRF protection onde aplicável
- rate limiting
- RBAC
- validação Zod
- sanitização
- CSP
- security headers
- proteção contra brute-force
- proteção de endpoints

Infraestrutura:

- Docker
- PostgreSQL
- LiveKit
- Redis opcional
- Docker Compose para ambiente local

Deployment:

Frontend:
Vercel ou Docker

Database:
Neon / Supabase PostgreSQL / PostgreSQL próprio

Media server:
LiveKit Cloud ou LiveKit self-hosted

==================================================
PRINCÍPIO IMPORTANTE
==================================================

Não implementar transmissão de vídeo através de WebSocket.

WebSockets podem ser utilizados para eventos da aplicação, mas mídia deve passar exclusivamente através de WebRTC/LiveKit.

Não criar implementação P2P mesh para vários participantes.

Usar arquitetura SFU através do LiveKit para permitir escalabilidade.

==================================================
TIPOS DE UTILIZADORES
==================================================

Existem três papéis principais:

OWNER
MODERATOR
VIEWER

OWNER:

- criou a sala
- pode iniciar screen share
- pode parar screen share
- pode mudar configurações
- pode expulsar participantes
- pode bloquear a sala
- pode gerar novo link
- pode terminar a sala

MODERATOR:

- pode remover participantes
- pode silenciar permissões
- não pode eliminar a sala

VIEWER:

- apenas assiste
- pode sair da sala
- pode utilizar chat se permitido

==================================================
FLUXO PRINCIPAL
==================================================

Homepage:

Logo

Título:

"Partilhe o seu ecrã em segundos."

Descrição:

"Crie uma sala privada, partilhe o link e transmita o seu ecrã em tempo real."

Botões:

Criar sala
Entrar numa sala

Se não estiver autenticado:

Criar sala poderá solicitar login.

==================================================
CRIAR SALA
==================================================

Quando o utilizador clicar:

Criar sala

mostrar modal:

Nome da sala

Exemplo:

Sessão de programação

Configurações:

Sala pública ou privada

Permitir convidados

Password opcional

Máximo de participantes

Permitir chat

Permitir áudio

Depois:

POST /api/rooms

Criar:

room

roomMember OWNER

Gerar:

slug seguro e não previsível

Exemplo:

room/7Yp3kQ9bXf

NÃO utilizar IDs incrementais na URL.

==================================================
PÁGINA DA SALA
==================================================

URL:

/room/[slug]

Layout desktop:

-----------------------------------
| Header                          |
-----------------------------------
|                                 |
|         SCREEN STREAM           |
|                                 |
|                                 |
-----------------------------------
| Participants | Chat             |
-----------------------------------
| Controls                        |
-----------------------------------

Controles do OWNER:

[Partilhar ecrã]

[Parar partilha]

[Microfone]

[Copiar link]

[Participantes]

[Configurações]

[Sair]

[Terminar sala]

VIEWER:

[Sair]

[Volume]

[Fullscreen]

==================================================
PARTILHA DE ECRÃ
==================================================

Quando OWNER clicar:

Partilhar ecrã

executar:

navigator.mediaDevices.getDisplayMedia()

Exemplo:

video:
{
    frameRate: {
        ideal: 30,
        max: 60
    },
    width: {
        ideal: 1920
    },
    height: {
        ideal: 1080
    }
}

audio:
true

O browser deve permitir ao utilizador escolher:

- ecrã inteiro
- janela
- separador do navegador

Nunca tentar selecionar automaticamente uma janela.

Isso deve permanecer sob controlo do browser.

==================================================
STREAM
==================================================

Publicar a track através do LiveKit.

Identificar:

source = screen_share

Se existir áudio:

source = screen_share_audio

Os VIEWERS devem subscrever automaticamente à track.

Mostrar loading enquanto aguardam stream.

Exemplo:

"O anfitrião ainda não iniciou a partilha."

Quando começar:

mostrar imediatamente o vídeo.

==================================================
ESTADO DE TRANSMISSÃO
==================================================

Estados possíveis:

OFFLINE
STARTING
LIVE
RECONNECTING
ENDED

Mostrar indicador:

● Em direto

quando stream estiver ativo.

Mostrar contador:

00:34:21

==================================================
WEBRTC
==================================================

Utilizar LiveKit Room.

Implementar:

connectionStateChanged

participantConnected

participantDisconnected

trackSubscribed

trackUnsubscribed

reconnecting

reconnected

disconnected

Tratar corretamente reconexões.

Não recarregar a página em caso de perda temporária de rede.

==================================================
TOKENS LIVEKIT
==================================================

NUNCA gerar tokens LiveKit no frontend.

Criar endpoint:

POST /api/livekit/token

Backend verifica:

1. utilizador
2. sala
3. membership
4. role
5. estado da sala

Depois gera token.

OWNER:

canPublish = true

VIEWER:

canPublish = false

VIEWER deve ter apenas:

canSubscribe = true

Usar token com expiração curta.

Exemplo:

15-30 minutos.

Permitir renovação segura.

==================================================
DATABASE
==================================================

Criar modelos Prisma.

User

id
name
email
image
passwordHash
createdAt
updatedAt


Room

id
slug
name
ownerId

visibility

PUBLIC
PRIVATE

passwordHash nullable

allowGuests boolean

allowChat boolean

allowAudio boolean

maxParticipants integer

status

WAITING
LIVE
ENDED

createdAt
updatedAt
endedAt nullable


RoomMember

id
roomId
userId nullable

guestId nullable

displayName

role

OWNER
MODERATOR
VIEWER

joinedAt
leftAt nullable


RoomInvite

id
roomId
tokenHash
expiresAt
maxUses nullable
uses
createdAt


RoomBan

id
roomId

userId nullable
ipHash nullable

createdAt


ChatMessage

id
roomId
memberId

content

createdAt


AuditLog

id
roomId
actorId nullable

event

metadata JSON

createdAt

==================================================
GUESTS
==================================================

Deve ser possível entrar sem conta se:

allowGuests = true

Pedir:

"Como quer ser chamado?"

Gerar guestId seguro.

Guardar apenas cookie seguro.

Guest não recebe privilégios.

==================================================
LINK DA SALA
==================================================

Não utilizar apenas:

/room/123

Utilizar slug criptograficamente aleatório.

Exemplo:

/room/k92Hd7QpzF4L

Gerar com crypto.randomBytes ou nanoid seguro.

==================================================
CONVITES
==================================================

Permitir OWNER gerar convites.

Formato:

/join/ey...

Não guardar token puro na database.

Guardar:

SHA-256(token)

Convites podem ter:

expiração

número máximo de utilizações

Exemplo:

válido 24h

máximo 10 pessoas

==================================================
PASSWORD
==================================================

Se sala tiver password:

hash com Argon2id.

Nunca guardar password original.

Implementar rate limit nas tentativas.

Exemplo:

5 tentativas por minuto.

==================================================
SEGURANÇA
==================================================

Implementar headers:

Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

Strict-Transport-Security em produção

frame-ancestors

Proteger contra clickjacking.

==================================================
VALIDAÇÃO
==================================================

Todos endpoints devem utilizar Zod.

Nunca confiar no frontend.

Validar:

IDs

slug

nome

role

mensagens

password

tokens

==================================================
RATE LIMIT
==================================================

Implementar rate limit principalmente em:

login

register

join room

room password

create room

invite generation

chat

LiveKit token

Exemplo:

Create room:
10/hora

Join:
30/minuto

Password:
5/minuto

Chat:
20 mensagens/10 segundos

==================================================
AUTORIZAÇÃO
==================================================

Criar função:

requireRoomPermission()

Exemplo:

requireRoomPermission(
    user,
    room,
    "REMOVE_PARTICIPANT"
)

Não espalhar checks manualmente por controllers.

Criar sistema central de permissões.

==================================================
CHAT
==================================================

Chat realtime.

Features:

mensagem

hora

nome

scroll automático

limite:

1000 caracteres

Aplicar rate limiting.

Escapar conteúdo.

Não renderizar HTML enviado pelo utilizador.

==================================================
PARTICIPANTES
==================================================

Sidebar:

Anderson
Host

João
Viewer

Maria
Viewer

Mostrar:

avatar

nome

role

estado de conexão

OWNER pode abrir menu:

Promover moderator

Remover

Banir

==================================================
EXPULSAR PARTICIPANTE
==================================================

Quando OWNER clicar:

Remover

backend valida permissão.

Desconectar participante do LiveKit.

Criar AuditLog.

==================================================
BAN
==================================================

Owner pode:

Banir utilizador

Usuário autenticado:

ban por userId.

Guest:

ban temporário utilizando guest identity.

Evitar depender apenas de IP.

==================================================
CONTROLE DA SALA
==================================================

OWNER pode:

Bloquear entrada.

Quando locked:

novos participantes recebem:

"Esta sala não está aceitando novos participantes."

==================================================
ENCERRAR SALA
==================================================

Quando OWNER clicar:

Terminar sala

pedir confirmação:

"Tem certeza que deseja terminar esta sala?"

Depois:

Room.status = ENDED

desconectar participantes.

Revogar convites.

Viewer vê:

"A transmissão terminou."

==================================================
COPIAR LINK
==================================================

Botão:

Copiar convite

Mostrar toast:

"Link copiado."

==================================================
SCREEN SHARE STOP
==================================================

IMPORTANTE:

O browser permite parar a partilha através da própria interface.

Detectar:

screenTrack.onended

Quando acontecer:

atualizar UI

Room status:

WAITING

Se OWNER encerrar a sala:

ENDED.

==================================================
PRIVACIDADE
==================================================

Não gravar transmissões por padrão.

Não armazenar screenshots.

Não armazenar vídeo.

Não armazenar áudio.

Mostrar claramente:

"A transmissão não está sendo gravada."

Se no futuro houver gravação:

deve exigir indicação clara e consentimento apropriado.

==================================================
DRM
==================================================

Não implementar mecanismos para contornar DRM, HDCP ou proteções de serviços de streaming.

A aplicação é destinada à partilha legítima de:

desktop

programação

apresentações

jogos permitidos

documentos

colaboração

Não tentar remover proteções existentes no browser ou sistema operacional.

==================================================
UI
==================================================

Design moderno.

Tema dark predominante.

Inspirado em:

Discord
Linear
Vercel

Mas sem copiar interfaces diretamente.

Usar:

rounded-xl

borders discretas

tipografia limpa

boa hierarquia visual

micro animações subtis

==================================================
RESPONSIVIDADE
==================================================

Desktop:

vídeo principal + sidebar.

Tablet:

sidebar recolhível.

Mobile:

vídeo

controles

tabs:

Chat
Participantes

Touch targets adequados.

==================================================
HOME
==================================================

Criar homepage profissional contendo:

Hero

"Partilhe o seu ecrã instantaneamente."

CTA:

Criar sala

Features:

Baixa latência

Salas privadas

Partilha segura

Sem downloads

Funciona no navegador

==================================================
DASHBOARD
==================================================

/dashboard

Mostrar:

Criar sala

Salas recentes

Salas ativas

Histórico

Exemplo:

Sessão frontend
Terminada

Pair programming
Ao vivo

==================================================
SETTINGS
==================================================

/settings

Perfil

Nome

Avatar

Password

Segurança

Sessões

Eliminar conta

==================================================
ERROR HANDLING
==================================================

Criar erros claros.

Exemplo:

Browser não suporta screen share.

Permissão recusada.

LiveKit indisponível.

Sala inexistente.

Sala terminada.

Sala cheia.

Senha incorreta.

Convite expirado.

Sem permissão.

==================================================
LOADING
==================================================

Utilizar skeletons.

Nunca deixar página branca durante requests.

==================================================
LOGGING
==================================================

Usar logger estruturado.

Não logar:

password

JWT

cookies

tokens LiveKit

tokens de convite

dados sensíveis

==================================================
OBSERVABILIDADE
==================================================

Preparar integração opcional:

Sentry

Logs estruturados

health endpoint

/api/health

Retornar:

database
livekit
server

==================================================
ENV
==================================================

Criar:

.env.example

DATABASE_URL=

AUTH_SECRET=

LIVEKIT_URL=

LIVEKIT_API_KEY=

LIVEKIT_API_SECRET=

NEXT_PUBLIC_APP_URL=

Nunca expor:

LIVEKIT_API_SECRET

no frontend.

==================================================
ESTRUTURA
==================================================

Utilizar arquitetura organizada.

src/

app/

api/

components/

features/

features/auth

features/rooms

features/stream

features/chat

features/participants

lib/

lib/auth

lib/db

lib/livekit

lib/security

lib/permissions

lib/rate-limit

server/

types/

schemas/

==================================================
SERVICES
==================================================

Separar regras de negócio.

Exemplo:

RoomService

createRoom()
joinRoom()
leaveRoom()
endRoom()
lockRoom()

InviteService

createInvite()
validateInvite()
revokeInvite()

LiveKitService

createRoomToken()
disconnectParticipant()

==================================================
API
==================================================

Criar endpoints REST.

POST /api/rooms

GET /api/rooms/:slug

PATCH /api/rooms/:slug

DELETE /api/rooms/:slug


POST /api/rooms/:slug/join

POST /api/rooms/:slug/leave

POST /api/rooms/:slug/end


POST /api/rooms/:slug/invites

DELETE /api/rooms/:slug/invites/:id


POST /api/rooms/:slug/participants/:id/kick

POST /api/rooms/:slug/participants/:id/ban


POST /api/livekit/token

==================================================
CONCORRÊNCIA
==================================================

Garantir que múltiplos pedidos simultâneos não ultrapassem:

maxParticipants.

Utilizar transações quando necessário.

==================================================
LIMITES
==================================================

Configuração padrão:

maxParticipants = 10

Configuração máxima inicial:

50

Arquitetura deve permitir aumentar futuramente.

==================================================
QUALIDADE DO STREAM
==================================================

Suportar adaptação automática.

Permitir futuramente:

720p
1080p

Utilizar simulcast quando suportado pelo LiveKit.

Não forçar bitrate absurdo.

==================================================
RECONEXÃO
==================================================

Se internet cair:

mostrar:

"Reconectando..."

Tentar reconectar.

Se recuperar:

"Conexão restaurada."

==================================================
TESTES
==================================================

Implementar testes.

Unit tests:

permissions

room service

invite validation

password validation

schemas

Integration tests:

create room

join room

protected room

expired invite

kick

ban

end room

livekit token authorization

E2E:

Playwright.

Fluxo:

login

create room

copy link

second browser joins

host shares

viewer sees stream

viewer leaves

host ends room

==================================================
ACESSIBILIDADE
==================================================

HTML semântico.

ARIA quando necessário.

Teclado funcional.

Contraste adequado.

Focus states.

==================================================
PERFORMANCE
==================================================

Não realizar rerenders desnecessários.

Dynamic imports onde fizer sentido.

Separar Server Components e Client Components corretamente.

Não colocar toda aplicação como "use client".

==================================================
SEO
==================================================

Somente páginas públicas precisam SEO.

Room pages privadas:

noindex

Dashboard:

noindex

==================================================
CÓDIGO
==================================================

Regras:

TypeScript strict.

Não utilizar any sem necessidade extrema.

Funções pequenas.

Código legível.

Sem duplicação.

Sem arquivos gigantes.

Separar lógica de UI e negócio.

Adicionar comentários somente quando ajudam a explicar decisões importantes.

==================================================
PRISMA
==================================================

Criar:

schema.prisma

migrations

seed opcional

Criar índices em:

Room.slug

Room.ownerId

Room.status

RoomMember.roomId

RoomMember.userId

RoomInvite.tokenHash

==================================================
TRANSAÇÕES
==================================================

Utilizar transações Prisma para operações críticas.

Exemplo:

join room:

1 verificar room
2 verificar ban
3 verificar limite
4 criar participant

deve ocorrer consistentemente.

==================================================
SEGURANÇA LIVEKIT
==================================================

Nunca permitir que cliente escolha arbitrariamente:

roomName

identity

role

permissions

Backend determina tudo.

Viewer não pode enviar media.

Host não pode publicar em sala diferente da sua.

Tokens devem ser associados ao room correto.

==================================================
FASES DE DESENVOLVIMENTO
==================================================

FASE 1

Criar projeto

Next.js

Tailwind

Prisma

PostgreSQL

Auth

Layout


FASE 2

Rooms

Criar sala

Entrar

Links


FASE 3

LiveKit

Host conecta

Viewer conecta

Screen share


FASE 4

Participant management

Kick

Ban

Roles


FASE 5

Chat realtime


FASE 6

Security hardening

rate limit

headers

auditing

validation


FASE 7

Testing


FASE 8

Docker + deployment

==================================================
MVP OBRIGATÓRIO
==================================================

Antes de adicionar funcionalidades avançadas, garantir completamente:

Utilizador cria sala.

Recebe link.

Outro navegador abre link.

Viewer entra.

Host pressiona:

"Partilhar ecrã"

Browser pergunta qual ecrã compartilhar.

Host seleciona.

Viewer começa a receber vídeo.

Host para partilha.

Viewer recebe estado correto.

Host termina sala.

Viewer é desconectado.

==================================================
CRITÉRIOS DE ACEITAÇÃO
==================================================

O projeto só é considerado funcional quando:

1. funciona em dois computadores diferentes;
2. funciona em redes diferentes;
3. permite múltiplos espectadores;
4. a conexão recupera de pequenas falhas de internet;
5. viewer não consegue publicar media;
6. viewer não consegue utilizar endpoints administrativos;
7. tokens não ficam expostos;
8. password não é armazenada em texto puro;
9. IDs previsíveis não são utilizados como convite;
10. inputs são validados;
11. existe rate limiting;
12. existe controlo de acesso;
13. vídeo não passa pelo servidor Next.js;
14. transmissão utiliza WebRTC;
15. aplicação funciona em produção via HTTPS.

==================================================
ANTES DE IMPLEMENTAR
==================================================

Primeiro:

1. analisa todos os requisitos;
2. apresenta a arquitetura;
3. mostra estrutura de pastas;
4. mostra schema da base de dados;
5. mostra fluxo WebRTC/LiveKit;
6. explica decisões de segurança;
7. cria plano de implementação.

Depois inicia o desenvolvimento.

Não gerar uma aplicação inteira num único arquivo.

Criar o projeto por módulos e por fases.

A cada fase:

- implementar;
- validar;
- testar;
- corrigir erros;
- somente depois avançar.

Priorizar estabilidade, segurança, legibilidade e experiência do utilizador.