module.exports = {
  metaExtension: '-meta.xml',
  pageType: 'page',
  staticresource: {
    generate: true,
    folderName: 'staticresources',
    extension: '.resource',
    name: 'appresources',
    assetsExtensions: [
      '.css',
      '.js',
      '.woff2',
      '.woff',
      '.svg',
      '.gif',
      '.png',
      '.jpg',
      '.jpeg',
      '.css.map',
      '.map',
    ],
    metaTemplate: `<?xml version="1.0" encoding="UTF-8"?>
      <StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
          <cacheControl>Public</cacheControl>
          <contentType>application/x-zip-compressed</contentType>
      </StaticResource>`,
  },
  component: {
    template: `<apex:component
        <%= !!options.controller ? 'controller="'+ options.controller + '"' : '' %>
        <%= !!options.extensions ? 'extensions="' + options.extensions + '"' : '' %>
        >
        <% if(options.attributes) { %>
          <% if(options.attributeWindowVar) { %>
            <script>
            window["<%= options.attributeWindowVar %>"] = {};
            </script>
          <% } %>
          <% options.attributes.forEach(function(attr) { %>
            <% if(options.attributeWindowVar) { %>
              <script>
              window["<%= options.attributeWindowVar %>"]["<%= attr.name %>"] = '{! JSENCODE(<%= attr.name %>) }';
              </script>
            <% } %>
            <apex:attribute
              name="<%= attr.name %>"
              type="<%= attr.type %>"
              <%= typeof(attr.description) != 'undefined' ? 'description="'+ attr.description +'"': '' %>
              <%= typeof(attr.assignTo) != 'undefined' ? 'assignTo="'+ attr.assignTo +'"': '' %>
              <%= typeof(attr.required) != 'undefined' ? 'required="'+ attr.required +'"': '' %>
              <%= typeof(attr.default) != 'undefined' ? 'default="'+ attr.required +'"': '' %>
            />
          <% }) %>
        <% } %>
  
        <% if (options.appMountId) { %>
          <div id="<%= options.appMountId %>"></div>
        <% } %>
        <script>
          window['<%= options.zipNameVar %>'] = '{! URLFOR($Resource.<%= options.zipName %>) }';
          window['<%= options.accessTokenVar %>'] = '{!JSENCODE($Api.Session_ID)}';
          window['<%= options.apiUrl %>'] = '<%= options['api'] %>';
          window['<%= options.userInfo %>'] = {
            display_name: '{! JSENCODE($User.FirstName) } {! JSENCODE($User.LastName) }',
            first_name: '{! JSENCODE($User.FirstName) }',
            last_name: '{! JSENCODE($User.LastName) }',
            nick_name: '{! JSENCODE($User.CommunityNickname) }',
            addr_country: '{! JSENCODE($User.Country) }',
            email: '{! JSENCODE($User.Email) }',
            mobile_phone: '{! JSENCODE($User.MobilePhone) }',
            user_id: '{! JSENCODE($User.Id) }'
          };
          <%=
            !!options.customScript ?
            options.customScript :
            ''
          %>
  
          <% if(options['.js'] ) { %>
            <% options['.js'].reverse().forEach(function(name) { %>
              var imported = document.createElement('script');
              imported.src = '{! URLFOR($Resource.<%= options.zipName %>, '<%= name %>') }';
              document.head.appendChild(imported);
            <% }) %>
          <% } %>
        </script>
        <% if(options['.css'] ) { %>
          <% options['.css'].reverse().forEach(function(name) { %>
            <apex:stylesheet value="{! URLFOR($Resource.<%= options.zipName %>, '<%= name %>') }" />
          <% }) %>
        <% } %>
        <% if(options['defaultScripts']) { %>
          <% options['defaultScripts'].forEach(function(name) { %>
            <script src="<%= name %>" type="text/javascript"></script>
          <% }) %>
        <% } %>
      </apex:component>`,
    metaTemplate: `<?xml version="1.0" encoding="UTF-8"?>
      <ApexComponent xmlns="http://soap.sforce.com/2006/04/metadata">
          <apiVersion>44.0</apiVersion>
          <label><%= options.label %></label>
      </ApexComponent>`,
    metaTemplateOptions: {
      label: 'Index_Component',
    },
    templateOptions: {
      attributeWindowVar: 'appComponentVars',
      attributes: [],
      appMountId: 'appComponent',
      accessTokenVar: 'SF_ACCESS_TOKEN',
      zipNameVar: 'SF_ZIP_NAME',
      userInfo: 'USER_INFO',
      apiUrl: 'API_URL',
      api: '',
    },
    folderName: 'components',
    extension: '.component',
    name: 'index_component',
  },
  page: {
    folderName: 'pages',
    generate: true,
    extension: '.page',
    name: 'index',
    appMountId: 'app',
    controller: null,
    standardController: null,
    template: `<apex:page
                <%= !!options.controller ? 'controller="'+ options.controller + '"' : '' %>
                <%= !!options.standardController ? 'standardController="'+ options.standardController + '"' : '' %>
                <%= !!options.extensions ? 'extensions="' + options.extensions + '"' : '' %>
                showHeader="<%= (options.showHeader !== undefined) ? options.showHeader : true %>"
                sidebar="<%= (options.sidebar !== undefined) ? options.sidebar : true %>"
                standardStylesheets="<%= (options.standardStylesheets !== undefined) ? options.standardStylesheets : true %>"
                applyHtmlTag="<%= (options.applyHtmlTag !== undefined) ? options.applyHtmlTag : true %>"
                applyBodyTag="<%= (options.applyBodyTag !== undefined) ? options.applyBodyTag : true %>"
                controller="BaseIFF_DataController">
                <head>
                  <% if(options['.css'] ) { %>
                    <% options['.css'].reverse().forEach(function(name) { %>
                      <apex:stylesheet value="{! URLFOR($Resource.<%= options.zipName %>, '<%= name %>') }" />
                    <% }) %>
                  <% } %>
                  <% if(options['meta']) { %>
                    <% options['meta'].forEach(function(group) { %>
                      <meta name="<%= group.name %>" content="<%= group.content %>" />
                    <% }) %>
                  <% } %>
                </head>
                <body>
                  <% if(options.remoteObject) { %>
                    <apex:remoteObjects
                        jsNamespace="<%= options.remoteObject.namespace %>"
                        <% if(options.updateOverride) { %>
                          update="{! <%= options.updateOverride %> }"
                        <% } %>
                      >
                      <% Object.keys(options.remoteObject.models).forEach(function (modelName) { %>
                        <% var packageName = options.remoteObject.models[modelName].packageName ? options.remoteObject.models[modelName].packageName + '__' : '' %>
                        <% var fields = options.remoteObject.models[modelName].fields || options.remoteObject.models[modelName] %>
                        <% var finalFields = fields.map((field) => { if(field.indexOf('__c') === -1 || !packageName) { return field; } return packageName + field; }).join(',') %>
                        <apex:remoteObjectModel name="<%= packageName %><%= modelName %>" fields="<%= finalFields %>" />
                      <% }) %>
                    </apex:remoteObjects >
                  <% } %>
                  <% if (options.appMountId) { %>
                    <div id="<%= options.appMountId%>"></div>
                  <% } %>
                  <script>
                    window['<%= options.zipNameVar %>'] = '{! URLFOR($Resource.<%= options.zipName %>) }';
                    window['<%= options.accessTokenVar %>'] = '{!JSENCODE($Api.Session_ID)}';
                    window['API_URL'] = '{!getURL}/services/apexrest';
                    window['<%= options.userInfo %>'] = {
                      display_name: '{! JSENCODE($User.FirstName) } {! JSENCODE($User.LastName) }',
                      first_name: '{! JSENCODE($User.FirstName) }',
                      last_name: '{! JSENCODE($User.LastName) }',
                      nick_name: '{! JSENCODE($User.CommunityNickname) }',
                      addr_country: '{! JSENCODE($User.Country) }',
                      email: '{! JSENCODE($User.Email) }',
                      mobile_phone: '{! JSENCODE($User.MobilePhone) }',
                      user_id: '{! JSENCODE($User.Id) }'
                    };
                    <%=
                      !!options.customScript ?
                      options.customScript :
                      ''
                    %>
                  </script>
                  <% if(options['.js'] ) { %>
                    <% options['.js'].reverse().forEach(function(name) { %>
                      <script src="{! URLFOR($Resource.<%= options.zipName %>, '<%= name %>') }"></script>
                    <% }) %>
                  <% } %>
                  <% if(options['defaultScripts']) { %>
                    <% options['defaultScripts'].forEach(function(name) { %>
                      <script src="<%= name %>" type="text/javascript"></script>
                    <% }) %>
                  <% } %>
                </body>
              </apex:page>`,
    metaTemplate: `<?xml version="1.0" encoding="UTF-8"?>
      <ApexPage xmlns="http://soap.sforce.com/2006/04/metadata">
          <apiVersion>44.0</apiVersion>
          <availableInTouch>false</availableInTouch>
          <confirmationTokenRequired>false</confirmationTokenRequired>
          <label><%= options.label %></label>
      </ApexPage>`,
    metaTemplateOptions: {
      label: 'Index',
    },
    templateOptions: {
      showHeader: false,
      sidebar: false,
      standardStylesheets: false,
      applyHtmlTag: false,
      applyBodyTag: false,
      appMountId: 'app',
      accessTokenVar: 'SF_ACCESS_TOKEN',
      zipNameVar: 'SF_ZIP_NAME',
      userInfo: 'USER_INFO',
      apiUrl: 'API_URL',
      api: '',
    },
  },
  sfPackage: {
    generate: true,
    extension: '.xml',
    name: 'package',
    template: `<?xml version="1.0" encoding="UTF-8"?>
      <Package xmlns="http://soap.sforce.com/2006/04/metadata">
          <% if(options['.page'] && options['.page'].length > 0 ) { %>
          <types>
            <% options['.page'].forEach(function (page) { %>
              <members><%= page %></members>
            <% }) %>
            <name>ApexPage</name>
          </types>
          <% } %>
          <% if(options['.component'] && options['.component'].length > 0 ) { %>
          <types>
            <% options['.component'].forEach(function (page) { %>
              <members><%= page %></members>
            <% }) %>
            <name>ApexComponent</name>
          </types>
          <% } %>
          <% if(options['.resource'] && options['.resource'].length > 0 ) { %>
          <types>
            <% options['.resource'].forEach(function (resource) { %>
              <members><%= resource %></members>
            <% }) %>
            <name>StaticResource</name>
          </types>
          <% } %>
          <version><%= options.apiVersion %></version>
      </Package>`,
    templateOptions: {
      apiVersion: '44.0',
    },
  },
};
