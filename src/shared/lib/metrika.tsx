import Script from 'next/script';

import { METRIKA_CONFIG } from '@/shared/config';
import { envManager } from '@/shared/lib';

type YandexMetricsGoalType = 'FORM_SUBMIT' | 'PHONE_CALL' | 'SOCIAL_CLICK';

interface YandexMetricsGoalParams {
  formId?: string;
  formType?: string;
  category?: string;
  value?: number;
  [key: string]: unknown;
}

interface YandexMetrikaEventOptions {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

declare global {
  interface Window {
    ym: (counterId: number, type: string, goal: string, params?: Record<string, unknown>) => void;
  }
}

class YandexMetrics {
  private static instance: YandexMetrics;
  private readonly counterId: number;
  private readonly isMetricsEnabled: boolean;

  private constructor() {
    const metricsId = process.env.YANDEX_METRICA_COUNTER_ID;
    if (!metricsId) {
      throw new Error('YANDEX_METRICA_COUNTER_ID environment variable is not defined');
    }

    this.counterId = Number(metricsId);
    this.isMetricsEnabled = this.checkIsMetricsEnabled();

    if (envManager.isDevelopment()) {
      envManager.debugLog('Yandex Metrics', 'Init', {
        enabled: this.isMetricsEnabled,
      });
    }
  }

  public static getInstance(): YandexMetrics {
    if (!YandexMetrics.instance) {
      YandexMetrics.instance = new YandexMetrics();
    }
    return YandexMetrics.instance;
  }

  public getCounterId(): number {
    return this.counterId;
  }

  private checkIsMetricsEnabled(): boolean {
    return !((envManager.isDevelopment() && envManager.isLocalhost()) || process.env.DISABLE_YANDEX_METRIKA === 'true');
  }

  private isAvailable(): boolean {
    if (!this.isMetricsEnabled) {
      return false;
    }

    if (typeof window === 'undefined' || !('ym' in window)) {
      return false;
    }

    return true;
  }

  public reachGoal(goal: YandexMetricsGoalType, params?: YandexMetricsGoalParams): void {
    envManager.debugLog('Yandex Metrika', 'Goal', { goal, params });

    if (!this.isAvailable()) {
      if (envManager.isDevelopment()) {
        console.warn('Yandex Metrika is disabled or not available');
      }
      return;
    }

    try {
      window.ym(this.counterId, 'reachGoal', goal, params);
    } catch (error) {
      console.error('Error sending goal to Yandex Metrika:', error);
    }
  }

  public sendEvent(options: YandexMetrikaEventOptions): void {
    envManager.debugLog('Yandex Metrika', 'Event', options);

    if (!this.isAvailable()) {
      if (envManager.isDevelopment()) {
        console.warn('Yandex Metrika is disabled or not available');
      }
      return;
    }

    try {
      const eventData = {
        action: options.action,
        label: options.label,
        value: options.value,
      };

      window.ym(this.counterId, 'sendEvent', options.category, eventData);
    } catch (error) {
      console.error('Error sending event to Yandex Metrika:', error);
    }
  }
}

export const metrika = YandexMetrics.getInstance();

export const useYandexMetrika = () => {
  return metrika;
};

// Компонент для подключения скрипта
export const YandexMetrikaScript: React.FC = () => {
  const counterId = metrika.getCounterId();

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "${METRIKA_CONFIG.scriptUrl}", "ym");
            ym(${counterId}, "init", ${JSON.stringify(METRIKA_CONFIG.defaultOptions)});
          `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${METRIKA_CONFIG.counterUrl}/${counterId}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
};
