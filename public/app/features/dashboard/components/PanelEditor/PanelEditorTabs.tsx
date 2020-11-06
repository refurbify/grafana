import React, { PureComponent, useCallback } from 'react';
import { config } from 'app/core/config';
import { css } from 'emotion';
import { IconName, stylesFactory, Tab, TabContent, TabsBar } from '@grafana/ui';
import { QueriesTab } from '../../panel_editor/QueriesTab';
import { AlertTab } from 'app/features/alerting/AlertTab';
import { TransformationsEditor } from '../TransformationsEditor/TransformationsEditor';
import { DashboardModel, PanelModel } from '../../state';
import { CoreEvents } from 'app/types';
import { PanelEditorTab, PanelEditorTabId } from './types';
import { contextSrv } from 'app/core/services/context_srv';

interface PanelEditorTabsProps {
  panel: PanelModel;
  dashboard: DashboardModel;
  tabs: PanelEditorTab[];
  onChangeTab: (tab: PanelEditorTab) => void;
}

export const PanelEditorTabs: React.FC<PanelEditorTabsProps> = ({panel, dashboard, tabs, onChangeTab}) => {
  const styles = getPanelEditorTabsStyles();
  const activeTab = tabs.find(item => item.active);

  componentWillUnmount() {
    const { panel } = this.props;
    panel.off(CoreEvents.queryChanged, this.triggerForceUpdate);
    panel.off(CoreEvents.transformationChanged, this.triggerForceUpdate);
  }

  triggerForceUpdate = () => {
    this.forceUpdate();
  };

  getCounter = (tab: PanelEditorTab) => {
    const { panel } = this.props;

    switch (tab.id) {
      case PanelEditorTabId.Query:
        return panel.targets.length;
      case PanelEditorTabId.Alert:
        return panel.alert ? 1 : 0;
      case PanelEditorTabId.Transform:
        const transformations = panel.getTransformations() ?? [];
        return transformations.length;
    }

    return null;
  }
  if (contextSrv?.user?.orgRole === 'Editor') {
    return (
      <div className={styles.wrapper}>
        <TabsBar className={styles.tabBar}>
          {tabs.map(tab => {
            if (tab.text === 'Alert') {
              return (
                <Tab
                  key={tab.id}
                  label={tab.text}
                  active={true}
                  onChangeTab={() => onChangeTab(tab)}
                  icon={tab.icon as IconName}
                  counter={getCounter(tab)}
                />
              );
            } else {
              return null;
            }
          })}
        </TabsBar>
        <TabContent className={styles.tabContent}>
          {activeTab.id === PanelEditorTabId.Alert && <AlertTab panel={panel} dashboard={dashboard}/>}
        </TabContent>
      </div>
    );
  }
  return (
    <div className={styles.wrapper}>
      <TabsBar className={styles.tabBar}>
        {tabs.map(tab => {
          return (
            <Tab
              key={tab.id}
              label={tab.text}
              active={tab.active}
              onChangeTab={() => onChangeTab(tab)}
              icon={tab.icon as IconName}
              counter={getCounter(tab)}
            />
          );
        })}
      </TabsBar>
      <TabContent className={styles.tabContent}>
        {activeTab.id === PanelEditorTabId.Query && <QueriesTab panel={panel} dashboard={dashboard} />}
        {activeTab.id === PanelEditorTabId.Alert && <AlertTab panel={panel} dashboard={dashboard} />}
        {activeTab.id === PanelEditorTabId.Transform && <TransformationsEditor panel={panel} />}
      </TabContent>
    </div>
  );
};

const getPanelEditorTabsStyles = stylesFactory(() => {
  const { theme } = config;

  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      height: 100%;
    `,
    tabBar: css`
      padding-left: ${theme.spacing.md};
    `,
    tabContent: css`
      padding: 0;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-height: 0;
      background: ${theme.colors.panelBg};
      border-right: 1px solid ${theme.colors.pageHeaderBorder};

      .toolbar {
        background: transparent;
      }
    `,
  };
});
