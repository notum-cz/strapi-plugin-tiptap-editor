# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**None** - This plugin does not integrate with external APIs or services.

## Data Storage

**Databases:**
- Not applicable - Data storage is handled by the host Strapi instance
- The plugin provides a custom field type that stores content as text/JSON within Strapi's database

**File Storage:**
- Not applicable - File uploads are not handled by this plugin

**Caching:**
- Not applicable - No caching layer or external cache service is integrated

## Authentication & Identity

**Auth Provider:**
- Not applicable - Authentication is handled entirely by the host Strapi instance
- The plugin uses Strapi's built-in permission and policy system via `server/src/policies/`

**Authorization:**
- Strapi policies: `server/src/policies/index.ts` (empty/not configured)
- Strapi middlewares: `server/src/middlewares/index.ts` (empty/not configured)

## Content Type & Field Integration

**Field Type Registration:**
- The plugin registers a custom field type named `richText` (from `shared/fields.ts`)
- Server registration: `server/src/fields/richTextField.ts` - CustomFieldServerOptions
- Admin registration: `admin/src/fields/richTextField.ts` - Field component configuration
- Content is stored as text type in Strapi's database schema

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- No custom logging implementation
- Uses standard console output (if configured in plugin code)

**Application Monitoring:**
- Not applicable - Delegated to host Strapi instance

## CI/CD & Deployment

**Hosting:**
- Not applicable - This is a plugin for Strapi
- Deployed as part of a Strapi project via npm/yarn package installation

**CI Pipeline:**
- Not configured - No CI/CD files detected

**Package Distribution:**
- Distributed via npm registry (@notum-cz/strapi-plugin-tiptap-editor)
- Built artifacts in `dist/` directory

## Build & Development Tools

**Build Tool:**
- @strapi/sdk-plugin - Strapi's official plugin build tool
- Outputs to `dist/` directory with CommonJS and ESM modules

**Configuration Management:**
- `server/src/config/index.ts` - Plugin configuration (currently empty validator)

## Environment Configuration

**Required env vars:**
- None - This plugin has no external service dependencies

**Secrets location:**
- Not applicable - No external credentials required

**Plugin-level configuration:**
- `server/src/config/index.ts` - Provides plugin configuration interface (currently unused)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Strapi Framework Integration Points

**Server-side Integration:**
- `server/src/register.ts` - Plugin registration with custom field
- `server/src/bootstrap.ts` - Bootstrap lifecycle hook
- `server/src/destroy.ts` - Cleanup lifecycle hook
- `server/src/controllers/index.ts` - Custom endpoints (if needed)
- `server/src/routes/index.ts` - Route definitions (if needed)
- `server/src/services/index.ts` - Business logic layer (if needed)
- `server/src/content-types/index.ts` - Content type definitions (if needed)

**Admin UI Integration:**
- `admin/src/index.ts` - Plugin registration with Strapi admin
- `admin/src/components/Initializer.tsx` - Plugin initialization component
- Field component: `admin/src/components/RichTextInput.tsx` - Main editor UI
- Translation loading: `admin/src/translations/{locale}.json` files

## Peer Dependencies

**Required by host Strapi instance:**
- @strapi/strapi ^5.35.0
- @strapi/sdk-plugin ^5.4.0
- react ^18.3.1
- react-dom ^18.3.1
- react-router-dom ^6.30.3
- styled-components ^6.3.9

All peer dependencies are managed by the host Strapi application and must be available in the consuming project.

## Component Integration

**Rich Text Field Type:**
- Registered as custom field in Strapi admin
- Can be added to any Strapi collection type
- Stores output as text field in database
- Editor configuration: `admin/src/components/RichTextInput.tsx`
  - Base configuration: `admin/src/components/BaseTiptapInput.tsx`
  - Styled components: `admin/src/components/TiptapInputStyles.ts`

**Toolbar Features:**
- Uses Strapi design system components (@strapi/design-system)
- Uses Strapi icons (@strapi/icons)
- Styled with styled-components
- Internationalized with react-intl

---

*Integration audit: 2026-03-10*
