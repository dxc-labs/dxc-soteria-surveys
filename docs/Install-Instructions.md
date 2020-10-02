# Configure Settings for Survey Components

## 1. Configure Run-Time Settings

```bash
    # update ./utilities/secrets.sh with keys
    chmod +x ./utilities/secrets.sh
    ./utilities/secrets.sh
```

## 2. Configure Deploy-Time Settings

### 2.1. Configure Logo

The logo shown in survey pages defaults to Project Soteria - packages/webroot/src/assets/img/**default_vertical_logo.png**.

To use tenant (client) specific logo, add **&lt;tenantName&gt;_vertical_logo.png** file in packages/webroot/src/assets/img.

### 2.2. Deploy Serverless Applications Gradually (Canary Deployments)

* To configure canary deployments, set the following parameter in config file config/soteria-&lt;tenantName&gt;-&lt;environmentName&gt;.json:

```json
{
    "Parameters": {
        "CanaryDeploymentType": "AllAtOnce"
    }
}
```

* The **CanaryDeploymentType** for each tenant defaults to **Canary10Percent5Minutes**.

* Valid values of CanaryDeploymentType are the ones supported by AWS SAM framework as documented in SAM [preference types](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/automating-updates-to-serverless-apps.html).

## 3. Configure Run-Time Settings

### 3.1. Override Dashboards API

> **_NOTE:_**  This option is for developer environment only.

Set config file parameter **OverrideDashboardsApi** to override dashboard API endpoint called by Surveys component. Developers can use this option to simply point to an API of a different tenant instead of building the component in the developer's tenant:

```json
{
    "Parameters": {
        "OverrideDashboardsApi": "https://api-xxx.example.com/dashboards/ext/sendtemplatemail"
    }
}
```

### 3.2. Override Risk API

> **_NOTE:_**  This option is for developer environment only.

Set config file parameter **OverrideRiskApi** to override Risk API endpoints called by Surveys component. Developers can use this option to simply point to an API of a different tenant instead of building the component in the developer's tenant:

```json
{
    "Parameters": {
        "OverrideRiskApi": "https://api-xxx.example.com/risk/classification"
    }
}
```

### 3.3. Override Rules API

> **_NOTE:_**  This option is for developer environment only.

Set config file parameter **OverrideRulesApi** to override Risk API endpoints called by Surveys component. Developers can use this option to simply point to an API of a different tenant instead of building the component in the developer's tenant:

```json
{
    "Parameters": {
        "OverrideRulesApi": "https://api-xxx.example.com/rules"
    }
}
```

Go back to overall install instructions ([sandbox](https://github.dxc.com/soteria/devops/blob/sandbox/Install-Instructions.md#surveys), [master](https://github.dxc.com/soteria/devops/blob/master/Install-Instructions.md#surveys), [production](https://github.dxc.com/soteria/devops/blob/production/Install-Instructions.md#surveys))
