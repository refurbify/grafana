import { metricAggregationConfig } from './utils';

export type PipelineMetricAggregationType = 'moving_avg' | 'derivative' | 'cumulative_sum' | 'bucket_script';

export type MetricAggregationType =
  | 'count'
  | 'avg'
  | 'sum'
  | 'min'
  | 'max'
  | 'extended_stats'
  | 'percentiles'
  | 'cardinality'
  | 'raw_document'
  | 'raw_data'
  | 'logs'
  | PipelineMetricAggregationType;

interface BaseMetricAggregation {
  id: string;
  type: MetricAggregationType;
  hide?: boolean;
}

export interface PipelineVariable {
  name: string;
  pipelineAgg: string;
}

export interface MetricAggregationWithField extends BaseMetricAggregation {
  field?: string;
}

export interface MetricAggregationWithMissingSupport extends BaseMetricAggregation {
  settings?: {
    missing?: string;
  };
}

export interface MetricAggregationWithInlineScript extends BaseMetricAggregation {
  settings?: {
    script?: string;
  };
}

interface Count extends BaseMetricAggregation {
  type: 'count';
}

interface Average
  extends MetricAggregationWithField,
    MetricAggregationWithMissingSupport,
    MetricAggregationWithInlineScript {
  type: 'avg';
  settings?: {
    script?: string;
    missing?: string;
  };
}

interface Sum extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  type: 'sum';
  settings?: {
    script?: string;
    missing?: string;
  };
}

interface Max extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  type: 'max';
  settings?: {
    script?: string;
    missing?: string;
  };
}

interface Min extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  type: 'min';
  settings?: {
    script?: string;
    missing?: string;
  };
}

export type ExtendedStatMetaType =
  | 'avg'
  | 'min'
  | 'max'
  | 'sum'
  | 'count'
  | 'std_deviation'
  | 'std_deviation_bounds_upper'
  | 'std_deviation_bounds_lower';
export interface ExtendedStat {
  label: string;
  value: ExtendedStatMetaType;
  default: boolean;
}

interface ExtendedStats extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  type: 'extended_stats';
  settings?: {
    script?: string;
    missing?: string;
    sigma?: string;
  };
  meta?: {
    [P in ExtendedStatMetaType]?: boolean;
  };
}

interface Percentiles extends MetricAggregationWithField, MetricAggregationWithInlineScript {
  type: 'percentiles';
  settings?: {
    percents?: string[];
    script?: string;
    missing?: string;
  };
}

export interface UniqueCount extends MetricAggregationWithField {
  type: 'cardinality';
  settings?: {
    precision_threshold?: string;
    missing?: string;
  };
}

interface RawDocument extends BaseMetricAggregation {
  type: 'raw_document';
  settings?: {
    size?: string;
  };
}

interface RawData extends BaseMetricAggregation {
  type: 'raw_data';
  settings?: {
    size?: string;
  };
}

interface Logs extends BaseMetricAggregation {
  type: 'logs';
}

export interface BasePipelineMetricAggregation extends MetricAggregationWithField {
  type: PipelineMetricAggregationType;
}

interface PipelineMetricAggregationWithMultipleBucketPaths extends BaseMetricAggregation {
  type: PipelineMetricAggregationType;
  pipelineVariables?: PipelineVariable[];
}

export type MovingAverageModel = 'simple' | 'linear' | 'ewma' | 'holt' | 'holt_winters';

export interface MovingAverageModelOption {
  label: string;
  value: MovingAverageModel;
}

type MovingAverageSettingsKey = 'alpha' | 'beta' | 'gamma' | 'period' | 'pad' | 'minimize';

type BaseMovingAverageModelSettings = {
  model?: MovingAverageModel;
  window?: string;
  predict?: string;
} & { [P in MovingAverageSettingsKey]?: string };

interface MovingAverageEWMAModelSettings extends BaseMovingAverageModelSettings {
  alpha: string;
  minimize: string;
}
interface MovingAverageHoltModelSettings extends BaseMovingAverageModelSettings {
  alpha: string;
  beta: string;
  minimize: string;
}
interface MovingAverageHoltWintersModelSettings extends BaseMovingAverageModelSettings {
  alpha: string;
  beta: string;
  gamma: string;
  period: string;
  pad: string;
  minimize: string;
}

type MovingAverageModelSettings =
  | Partial<MovingAverageEWMAModelSettings>
  | Partial<MovingAverageHoltModelSettings>
  | Partial<MovingAverageHoltWintersModelSettings>;

export interface MovingAverageSettingDefinition {
  label: string;
  value: keyof MovingAverageModelSettings;
  type?: 'boolean' | 'string';
}

interface MovingAverage extends BasePipelineMetricAggregation {
  type: 'moving_avg';
  settings?: MovingAverageModelSettings;
}

export interface Derivative extends BasePipelineMetricAggregation {
  type: 'derivative';
  settings?: {
    unit?: string;
  };
}

interface CumulativeSum extends BasePipelineMetricAggregation {
  type: 'cumulative_sum';
  settings?: {
    format?: string;
  };
}

export interface BucketScript extends PipelineMetricAggregationWithMultipleBucketPaths {
  type: 'bucket_script';
  settings?: {
    script?: string;
  };
}

type PipelineMetricAggregation = MovingAverage | Derivative | CumulativeSum | BucketScript;

export type MetricAggregationWithSettings =
  | BucketScript
  | CumulativeSum
  | Derivative
  | RawData
  | RawDocument
  | UniqueCount
  | Percentiles
  | ExtendedStats
  | Min
  | Max
  | Sum
  | Average
  | MovingAverage;

export type MetricAggregationWithMeta = ExtendedStats;

export type MetricAggregation = Count | Logs | PipelineMetricAggregation | MetricAggregationWithSettings;

// Guards
// Given the structure of the aggregations (ie. `settings` field being always optional) we cannot
// determine types based solely on objects' properties, therefore we use `metricAggregationConfig` as the
// source of truth.

/**
 * Checks if `metric` requires a field (either referring to a document or another aggregation)
 * @param metric
 */
export const isMetricAggregationWithField = (
  metric: BaseMetricAggregation | MetricAggregationWithField
): metric is MetricAggregationWithField => metricAggregationConfig[metric.type].requiresField;

export const isPipelineAggregation = (
  metric: BaseMetricAggregation | PipelineMetricAggregation
): metric is PipelineMetricAggregation => metricAggregationConfig[metric.type].isPipelineAgg;

export const isPipelineAggregationWithMultipleBucketPaths = (
  metric: BaseMetricAggregation | PipelineMetricAggregationWithMultipleBucketPaths
): metric is PipelineMetricAggregationWithMultipleBucketPaths =>
  metricAggregationConfig[metric.type].supportsMultipleBucketPaths;

export const isMetricAggregationWithMissingSupport = (
  metric: BaseMetricAggregation | MetricAggregationWithMissingSupport
): metric is MetricAggregationWithMissingSupport => metricAggregationConfig[metric.type].supportsMissing;

export const isMetricAggregationWithSettings = (
  metric: BaseMetricAggregation | MetricAggregationWithSettings
): metric is MetricAggregationWithSettings => metricAggregationConfig[metric.type].hasSettings;

export const isMetricAggregationWithMeta = (
  metric: BaseMetricAggregation | MetricAggregationWithMeta
): metric is MetricAggregationWithMeta => metricAggregationConfig[metric.type].hasMeta;

export const isMetricAggregationWithInlineScript = (
  metric: BaseMetricAggregation | MetricAggregationWithInlineScript
): metric is MetricAggregationWithInlineScript => metricAggregationConfig[metric.type].supportsInlineScript;

export const isMetricAggregationType = (s: MetricAggregationType | string): s is MetricAggregationType =>
  [
    'count',
    'avg',
    'sum',
    'min',
    'max',
    'extended_stats',
    'percentiles',
    'cardinality',
    'raw_document',
    'raw_data',
    'logs',
    'moving_avg',
    'derivative',
    'cumulative_sum',
    'bucket_script',
  ].includes(s);
