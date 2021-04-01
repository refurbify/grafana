package sqlstore

import (
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/stretchr/testify/assert"
	"strconv"
	"testing"
)

const (
	ORG_ID    int64 = 0
	FOLDER_ID       = 0
	PANEL_ID  int64 = 1
)

const (
	VIEWER_ID int64 = 1 << iota
	EDITOR_ID
	ADMIN_ID
)

func TestAlertCreation(t *testing.T) {
	dash := initTestDashboardWithAlerts(t, ORG_ID, FOLDER_ID, PANEL_ID)

	t.Run("different users can create separate alerts on the same dashboard", func(t *testing.T) {
		alertsQuery := &models.GetAlertsByDashboardId{
			Id: dash.Id,
		}
		err := GetAlertsForDashboard(alertsQuery)
		assert.Nil(t, err)

		alerts := alertsQuery.Result
		assert.Equal(t, 2, len(alerts))
		assert.NotEqual(t, alerts[0].UserId, alerts[1].UserId)
	})
}

func TestAlertAccessibilityForRoleViewer(t *testing.T) {
	dash := initTestDashboardWithAlerts(t, ORG_ID, FOLDER_ID, PANEL_ID)

	t.Run("viewers can see their own alerts", func(t *testing.T) {
		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_VIEWER},
			VIEWER_ID,
		)

		assert.Equal(t, 1, len(alerts))
		assert.Equal(t, VIEWER_ID, alerts[0].UserId)
	})

	t.Run("viewers can update their own alerts", func(t *testing.T) {
		alert, err := GetAlertsForUser(dash.Id, PANEL_ID, VIEWER_ID, nil)
		assert.Nil(t, err)

		newName := "User " + strconv.Itoa(int(VIEWER_ID)) + " - Alert Updated"

		alert.Name = newName

		alertCommand := &models.SaveAlertsCommand{
			DashboardId: dash.Id,
			UserId:      VIEWER_ID,
			OrgId:       dash.OrgId,
			Alerts:      []*models.Alert{alert},
		}
		err = SaveAlerts(alertCommand)
		assert.Nil(t, err)

		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_VIEWER},
			VIEWER_ID,
		)
		assert.Equal(t, newName, alerts[0].Name)
	})

	t.Run("viewers cannot update other user's alerts", func(t *testing.T) {
		alert, err := GetAlertsForUser(dash.Id, PANEL_ID, EDITOR_ID, nil)
		assert.Nil(t, err)

		newName := "User " + strconv.Itoa(int(VIEWER_ID)) + " - Alert Updated"

		alert.Name = newName

		alertCommand := &models.SaveAlertsCommand{
			DashboardId: dash.Id,
			UserId:      VIEWER_ID,
			OrgId:       dash.OrgId,
			Alerts:      []*models.Alert{alert},
		}
		err = SaveAlerts(alertCommand)
		assert.EqualError(t, err, "This user is not authorised to update the alerts")

		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_EDITOR},
			EDITOR_ID,
		)
		assert.NotEqual(t, newName, alerts[0].Name)
	})

	/*t.Run("viewers can delete their own alerts", func(t *testing.T) {
		alert, err := GetAlertsForUser(dash.Id, PANEL_ID, VIEWER_ID, nil)
		assert.Nil(t, err)

		alert.PanelId = -1

		alertCommand := &models.SaveAlertsCommand{
			DashboardId: dash.Id,
			UserId:      VIEWER_ID,
			OrgId:       dash.OrgId,
			Alerts:      []*models.Alert{alert},
		}
		err = SaveAlerts(alertCommand)
		assert.Nil(t, err)

		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_VIEWER},
			VIEWER_ID,
		)
		assert.Equal(t, 0, len(alerts))
	})*/
}

func TestAlertAccessibilityForRoleEditor(t *testing.T) {
	dash := initTestDashboardWithAlerts(t, ORG_ID, FOLDER_ID, PANEL_ID)

	t.Run("editors can see their own alerts", func(t *testing.T) {
		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_EDITOR},
			EDITOR_ID,
		)

		assert.Equal(t, 1, len(alerts))
		assert.Equal(t, EDITOR_ID, alerts[0].UserId)
	})

	t.Run("editors can update their own alerts", func(t *testing.T) {
		alert, err := GetAlertsForUser(dash.Id, PANEL_ID, EDITOR_ID, nil)
		assert.Nil(t, err)

		newName := "User " + strconv.Itoa(int(EDITOR_ID)) + " - Alert Updated"

		alert.Name = newName

		alertCommand := &models.SaveAlertsCommand{
			DashboardId: dash.Id,
			UserId:      EDITOR_ID,
			OrgId:       dash.OrgId,
			Alerts:      []*models.Alert{alert},
		}
		err = SaveAlerts(alertCommand)
		assert.Nil(t, err)

		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_EDITOR},
			EDITOR_ID,
		)
		assert.Equal(t, newName, alerts[0].Name)
	})

	t.Run("editors cannot update other user's alerts", func(t *testing.T) {
		alert, err := GetAlertsForUser(dash.Id, PANEL_ID, VIEWER_ID, nil)
		assert.Nil(t, err)

		newName := "User " + strconv.Itoa(int(EDITOR_ID)) + " - Alert Updated"

		alert.Name = newName

		alertCommand := &models.SaveAlertsCommand{
			DashboardId: dash.Id,
			UserId:      EDITOR_ID,
			OrgId:       dash.OrgId,
			Alerts:      []*models.Alert{alert},
		}
		err = SaveAlerts(alertCommand)
		assert.EqualError(t, err, "This user is not authorised to update the alerts")

		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_VIEWER},
			VIEWER_ID,
		)
		assert.NotEqual(t, newName, alerts[0].Name)
	})
}

func TestAlertAccessibilityForRoleAdmin(t *testing.T) {
	dash := initTestDashboardWithAlerts(t, ORG_ID, FOLDER_ID, PANEL_ID)

	t.Run("admins can see all the alerts", func(t *testing.T) {
		alerts := getUserAlertsForDashboard(
			t,
			[]int64{dash.Id},
			PANEL_ID,
			dash.OrgId,
			&models.SignedInUser{OrgRole: models.ROLE_ADMIN},
			ADMIN_ID,
		)
		assert.Equal(t, 2, len(alerts))
	})
}

func getUserAlertsForDashboard(
	t *testing.T,
	dashboardIds []int64,
	panelId int64,
	orgId int64,
	user *models.SignedInUser,
	userId int64,
) []*models.AlertListItemDTO {
	alertsQuery := models.GetAlertsQuery{
		DashboardIDs: dashboardIds,
		PanelId:      panelId,
		OrgId:        orgId,
		User:         user,
		UserId:       userId,
	}

	err := HandleAlertsQuery(&alertsQuery)
	assert.Nil(t, err)

	return alertsQuery.Result
}

func initTestDashboardWithAlerts(t *testing.T, orgId int64, folderId int64, panelId int64) *models.Dashboard {
	InitTestDB(t)

	dash := insertTestDashboard(t, "dashboard with alerts", orgId, folderId, false, "alert")

	for i := 1; i < 3; i++ {
		_ = insertTestAlertForUser(
			t,
			"User "+strconv.Itoa(i)+" - Alert",
			"Test alert",
			dash.OrgId,
			dash.Id,
			panelId,
			int64(i),
			simplejson.New(),
		)
	}

	return dash
}

func insertTestAlertForUser(
	t *testing.T,
	title string,
	message string,
	orgId int64,
	dashId int64,
	panelId int64,
	userId int64,
	settings *simplejson.Json,
) *models.Alert {
	evalData, _ := simplejson.NewJson([]byte(`{"test": "test"}`))

	items := []*models.Alert{
		{
			Name:        title,
			Message:     message,
			OrgId:       orgId,
			DashboardId: dashId,
			PanelId:     panelId,
			Settings:    settings,
			Frequency:   1,
			EvalData:    evalData,
			UserId:      userId,
		},
	}

	cmd := models.SaveAlertsCommand{
		Alerts:      items,
		DashboardId: dashId,
		OrgId:       orgId,
		UserId:      userId,
	}

	err := SaveAlerts(&cmd)
	assert.Nil(t, err)

	return cmd.Alerts[0]
}

func insertTestDashboard(
	t *testing.T,
	title string,
	orgId int64,
	folderId int64,
	isFolder bool,
	tags ...interface{},
) *models.Dashboard {
	cmd := models.SaveDashboardCommand{
		OrgId:    orgId,
		FolderId: folderId,
		IsFolder: isFolder,
		Dashboard: simplejson.NewFromAny(map[string]interface{}{
			"id":    nil,
			"title": title,
			"tags":  tags,
		}),
	}

	err := SaveDashboard(&cmd)
	assert.Nil(t, err)

	cmd.Result.Data.Set("id", cmd.Result.Id)
	cmd.Result.Data.Set("uid", cmd.Result.Uid)

	return cmd.Result
}
