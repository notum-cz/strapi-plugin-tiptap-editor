import { PLUGIN_ID } from '../../../shared/src/pluginId';
import { RICH_TEXT_FIELD_NAME } from '../../../shared/src/fields';
import { CustomFieldServerOptions } from '@strapi/types/dist/modules/custom-fields';

export const richTextField: CustomFieldServerOptions = {
  name: RICH_TEXT_FIELD_NAME,
  plugin: PLUGIN_ID,
  type: 'text',
  inputSize: {
    default: 12,
    isResizable: true,
  },
};
