import { locale as appLocale } from 'svelte-i18n';
import { get } from 'svelte/store';
import { siteConfig } from '$lib/services/config';
import { isObject } from '$lib/services/utils/misc';

/**
 * The default, normalized i18n configuration with no locales defined.
 * @type {I18nConfig}
 */
export const defaultI18nConfig = {
  i18nEnabled: false,
  saveAllLocales: true,
  locales: ['_default'],
  defaultLocale: '_default',
  structure: 'single_file',
};

/**
 * Get the normalized i18n configuration for the given collection or collection file.
 * @param {RawCollection} collection Collection.
 * @param {RawCollectionFile} [file] Collection file.
 * @returns {I18nConfig} Config.
 * @see https://decapcms.org/docs/beta-features/#i18n-support
 */
export const getI18nConfig = (collection, file) => {
  const _siteConfig = get(siteConfig);
  /** @type {RawI18nConfig | undefined} */
  let config;

  if (isObject(_siteConfig?.i18n)) {
    config = _siteConfig.i18n;

    if (collection?.i18n) {
      if (isObject(collection.i18n)) {
        Object.assign(config, collection.i18n);
      }

      if (file) {
        if (file.i18n) {
          if (isObject(file.i18n)) {
            Object.assign(config, file.i18n);
          }
        } else {
          config = undefined;
        }
      }
    } else {
      config = undefined;
    }
  }

  const {
    structure = 'single_file',
    locales = [],
    default_locale: defaultLocale = undefined,
    save_all_locales: saveAllLocales = true,
  } = /** @type {RawI18nConfig} */ (config ?? {});

  const i18nEnabled = !!locales.length;

  return {
    i18nEnabled,
    saveAllLocales,
    locales: i18nEnabled ? locales : ['_default'],
    // eslint-disable-next-line no-nested-ternary
    defaultLocale: !i18nEnabled
      ? '_default'
      : defaultLocale && locales.includes(defaultLocale)
        ? defaultLocale
        : locales[0],
    // @todo Figure out how file collections can utilize the `multiple_files` or `multiple_folders`
    // i18n structure. https://github.com/decaporg/decap-cms/issues/5280
    structure: file ? 'single_file' : structure,
  };
};

/**
 * Get the canonical locale of the given locale that can be used for various `Intl` methods.
 * @param {LocaleCode} locale Locale.
 * @returns {StandardLocaleCode | undefined} Locale or `undefined` if not determined.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument
 */
export const getCanonicalLocale = (locale) => {
  let canonicalLocale = undefined;

  if (locale !== '_default') {
    try {
      [canonicalLocale] = Intl.getCanonicalLocales(locale);
    } catch {
      //
    }
  }

  return canonicalLocale;
};

/**
 * Translate the given locale code in the application UI locale.
 * @param {LocaleCode} locale Locale code like `en`.
 * @returns {string} Locale label like `English`. If the formatter raises an error, just return the
 * locale code as is.
 */
export const getLocaleLabel = (locale) => {
  const canonicalLocale = getCanonicalLocale(locale);

  try {
    return new Intl.DisplayNames(get(appLocale), { type: 'language' }).of(canonicalLocale);
  } catch {
    return locale;
  }
};
