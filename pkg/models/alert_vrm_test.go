package models

import (
	"github.com/stretchr/testify/suite"
	"testing"
)

type AlertTestSuite struct {
	suite.Suite
}

func (suite *AlertTestSuite) SetupTest() {
}

func (suite *AlertTestSuite) TestExample() {
	suite.Equal(5, 5)
}

func TestAlertTestSuite(t *testing.T) {
	suite.Run(t, new(AlertTestSuite))
}
