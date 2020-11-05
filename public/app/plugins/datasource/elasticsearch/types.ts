import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { BucketAggregation, BucketAggregationType } from './components/BucketAggregationsEditor/state/types';
import { MetricAggregation, MetricAggregationType } from './components/MetricAggregationsEditor/aggregations';

export interface ElasticsearchOptions extends DataSourceJsonData {
  timeField: string;
  esVersion: number;
  interval?: string;
  timeInterval: string;
  maxConcurrentShardRequests?: number;
  logMessageField?: string;
  logLevelField?: string;
  dataLinks?: DataLinkConfig[];
}

// TODO: Fix the stuff below here.
interface MetricConfiguration {
  label: string;
  requiresField: boolean;
  supportsInlineScript: boolean;
  supportsMissing: boolean;
  isPipelineAgg: boolean;
  minVersion?: number;
  supportsMultipleBucketPaths: boolean;
  isSingleMetric?: boolean;
  // TODO: this can probably be inferred from other settings
  hasSettings: boolean;
  hasMeta: boolean;
}

interface BucketConfiguration {
  label: string;
  requiresField: boolean;
}
export type MetricsConfiguration = Record<MetricAggregationType, MetricConfiguration>;
export type BucketsConfiguration = Record<BucketAggregationType, BucketConfiguration>;

export interface ElasticsearchAggregation {
  id: string;
  type: MetricAggregationType | BucketAggregationType;
  settings?: unknown;
  field?: string;
  hide: boolean;
}

export interface ElasticsearchQuery extends DataQuery {
  isLogsQuery?: boolean;
  alias?: string;
  query?: string;
  bucketAggs?: BucketAggregation[];
  metrics?: MetricAggregation[];
  timeField?: string;
}

export type DataLinkConfig = {
  field: string;
  url: string;
  datasourceUid?: string;
};
