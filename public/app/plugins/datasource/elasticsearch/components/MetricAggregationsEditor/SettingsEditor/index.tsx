import { InlineField, Input, Select, Switch } from '@grafana/ui';
import React, { FunctionComponent, ComponentProps } from 'react';
import { extendedStats, movingAvgModelOptions, movingAvgModelSettings } from '../../../query_def';
import { useDispatch } from '../../ElasticsearchQueryContext';
import { changeMetricMeta, changeMetricSetting } from '../state/actions';
import {
  isMetricAggregationWithInlineScript,
  MetricAggregation,
  isMetricAggregationWithMissingSupport,
} from '../state/types';
import { isValidNumber } from '../utils';
import { BucketScriptSettingsEditor } from './BucketScriptSettingsEditor';
import { SettingField } from './SettingField';
import { SettingsEditorContainer } from '../../SettingsEditorContainer';
import { useDescription } from './useDescription';

// TODO" Move this somewhere and share it with BucketsAggregation Editor
const inlineFieldProps: Partial<ComponentProps<typeof InlineField>> = {
  labelWidth: 16,
};

interface Props {
  metric: MetricAggregation;
  previousMetrics: MetricAggregation[];
}

export const SettingsEditor: FunctionComponent<Props> = ({ metric, previousMetrics }) => {
  const dispatch = useDispatch();
  const description = useDescription(metric);

  return (
    <SettingsEditorContainer label={description}>
      {metric.type === 'derivative' && <SettingField label="Unit" metric={metric} settingName="unit" />}

      {metric.type === 'cumulative_sum' && <SettingField label="Format" metric={metric} settingName="format" />}

      {metric.type === 'moving_avg' && (
        // TODO: onBlur, defaultValue
        <>
          <InlineField label="Model" {...inlineFieldProps}>
            <Select
              onChange={value => dispatch(changeMetricSetting(metric, 'model', value.value!))}
              options={movingAvgModelOptions}
              defaultValue={
                movingAvgModelOptions.find(m => m.value === metric.settings?.model) || movingAvgModelOptions[0]
              }
            />
          </InlineField>
          <InlineField label="Window" {...inlineFieldProps} invalid={!isValidNumber(metric.settings?.window)}>
            <Input
              defaultValue={metric.settings?.window || '5'}
              onBlur={e => dispatch(changeMetricSetting(metric, 'window', e.target.value))}
            />
          </InlineField>

          <SettingField label="Predict" metric={metric} settingName="predict" />

          {movingAvgModelSettings[metric.settings?.model || 'simple'].map(modelOption => {
            // FIXME: This is kinda ugly and types are not perfect. Need to give it a second shot.
            const InputComponent = modelOption.type === 'boolean' ? Switch : Input;
            const componentChangeEvent = modelOption.type === 'boolean' ? 'onChange' : 'onBlur';
            const eventAttr = modelOption.type === 'boolean' ? 'checked' : 'value';
            const componentChangeHandler = (e: any) =>
              dispatch(changeMetricSetting(metric, modelOption.value, (e.target as any)[eventAttr]));

            return (
              <InlineField label={modelOption.label} {...inlineFieldProps} key={modelOption.value}>
                <InputComponent
                  defaultValue={metric.settings?.[modelOption.value]}
                  {...{
                    [componentChangeEvent]: componentChangeHandler,
                  }}
                />
              </InlineField>
            );
          })}
        </>
      )}

      {metric.type === 'bucket_script' && (
        <BucketScriptSettingsEditor value={metric} previousMetrics={previousMetrics} />
      )}

      {(metric.type === 'raw_data' || metric.type === 'raw_document') && (
        <InlineField label="Size" {...inlineFieldProps}>
          <Input
            onBlur={e => dispatch(changeMetricSetting(metric, 'size', e.target.value))}
            // TODO: this should be set somewhere else
            defaultValue={metric.settings?.size ?? '500'}
          />
        </InlineField>
      )}

      {metric.type === 'cardinality' && (
        <SettingField label="Precision Threshold" metric={metric} settingName="precision_threshold" />
      )}

      {metric.type === 'extended_stats' && (
        <>
          {extendedStats.map(stat => (
            <InlineField label={stat.label} {...inlineFieldProps} key={stat.value}>
              <Switch
                onChange={e => dispatch(changeMetricMeta(metric, stat.value, (e.target as any).checked))}
                value={metric.meta?.[stat.value] ?? stat.default}
              />
            </InlineField>
          ))}

          <SettingField label="Sigma" metric={metric} settingName="sigma" placeholder="3" />
        </>
      )}

      {metric.type === 'percentiles' && (
        <InlineField label="Percentiles" {...inlineFieldProps}>
          <Input
            onBlur={e => dispatch(changeMetricSetting(metric, 'percents', e.target.value.split(',').filter(Boolean)))}
            defaultValue={metric.settings?.percents}
            placeholder="1,5,25,50,75,95,99"
          />
        </InlineField>
      )}

      {isMetricAggregationWithInlineScript(metric) && (
        <SettingField label="Script" metric={metric} settingName="script" placeholder="_value * 1" />
      )}

      {isMetricAggregationWithMissingSupport(metric) && (
        <SettingField
          label="Missing"
          metric={metric}
          settingName="missing"
          // TODO: This should be better formatted.
          tooltip="The missing parameter defines how documents that are missing a value should be treated. By default
            they will be ignored but it is also possible to treat them as if they had a value"
        />
      )}
    </SettingsEditorContainer>
  );
};
