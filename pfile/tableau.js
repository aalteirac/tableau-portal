
  var viz;
  var check;
  var maskDelay=500;
  var retryElement=0
  var workbook,
    activeSheet,
    selectedMarks,
    options,
    placeholderDiv,
    activeFilterSheet;
  var alertTM,subTM;  

  function loadViz1() {
    url="http://10.177.51.176/#/views/Superstore/Overview?:render=true&:jsdebug=n"
    placeholderDiv = document.getElementById("tableauViz");
    options = {
      width: "100%",
      height: "85vh",
      hideTabs: true,
      hideToolbar: true,
      onFirstInteractive: function () {
        pimpdash();
        // getAlertsForCurrentView();
        //findFilterSheet("Sector Comparison");
        $("#mask").fadeOut(maskDelay,()=>{});
        // findFilterSheet("Investor AUM & Performance");
      },
    };
    loadViz(placeholderDiv, url, options);
  }

  function loadViz(placeholderDiv, url, options,menushow) {

    function go(){
      if (viz) {
        viz.dispose();
      }
      clearInterval(check);
      viz = new tableau.Viz(placeholderDiv, url, options);
      check=setInterval(()=>{
        $("iframe").each(function( index ) {
          var idoc=this.contentWindow.document;
          var loader=idoc.getElementById("initializing_thin_client");
          if (loader){
            $(loader).hide();
            clearInterval(check);
          }
          var tt=idoc.getElementsByClassName("login-pf")[0];
          if (tt){
            $(idoc.getElementById("kc-login")).click(()=>{
              $("#mask").show();
            })
            $("#mask").fadeOut(maskDelay,()=>{});
            clearInterval(check);
          }
        })
      },1000)
    }
    if(menushow==""){
      $(".menu").slideToggle(300,()=>{
        go();
      });
    }
    else{
      go();
    }
  }

  function poptrigAlert(event){
    clearTimeout(subTM);
    clearTimeout(alertTM);
    if(event.srcElement.checked){
      $("#toggle").prop("checked",false);
      alertTM= setTimeout(() => {
        $("#toggleAlert").prop("checked",false)
      }, 5000);
    }
  }

  function poptrigSubs(event){
    clearTimeout(subTM);
    clearTimeout(alertTM);
    if(event.srcElement.checked){
      $("#toggleAlert").prop("checked",false);
      subTM=setTimeout(() => {
        $("#toggle").prop("checked",false)
      }, 5000);
    }
  }

  function regionFilterStatic(sector) {
    if (sector === "") {
      activeFilterSheet.clearFilterAsync("Sector");
    } else {
      activeFilterSheet.applyFilterAsync(
        "Sector",
        sector,
        tableau.FilterUpdateType.REPLACE
      );
    }
  }

  function logout(token,frame,url){
    $.ajax({
      url:url,
      type:"POST",
      headers: {"X-XSRF-TOKEN":token},
      contentType:"application/json; charset=utf-8",
      dataType:"json",
      data:"{}",
      success: function(){
        frame.location.reload();
      }
    })
  }

  function addStyle(doc,styleString) {
    const style = doc.createElement('style');
    style.textContent = styleString;
    doc.head.append(style);
  }

  function pimpdash(){
    $("iframe").each(function( index ) {
        var idoc=this.contentWindow.document;
        var css=`
          .FIItem.FISelected{
            background-color:transparent !important;
          }
          .tab-textRegion-boundary{
            background-color:transparent !important;
          }
          .tab-zone-padding{
            background-color:transparent !important;
          }
          .tab-zone-margin{
            background-color:transparent !important;
          }
          .dijitButton{
            background-color:transparent !important;
          }
        `
        addStyle(idoc,css);
      });
  }

  function pimpedit(){
    var map,clone,contextTab;
    $("iframe").each(function( index ) {

        var idoc=this.contentWindow.document;
        $(this.contentWindow.document.getElementsByClassName("tabAuthMenuBarExitButton")[0]).click((e)=>{
            $("#mask").show();
            //in case it shows the save dialog :-)
            setTimeout(()=>{
              $("iframe").each(function( index ) {
                if(this.contentWindow.document.querySelector(".tab-dialog.tab-widget.tabDropTarget.active")!=null)
                $("#mask").hide();
              })
            },2000);
        })
        
        var css=`
          .tabAuthLeftViewAreaResizer,.tab-schemaCommon,.tab-dataSources, .tab-Section, .tabButton, .rightEdge, .tabAuthSchemaCollapse, .tabAuthTabNav, .tabAuthLeftViewArea, .tabTabLabel, .tabAuthTab, .tabAuthTabStatusBar{
            border:none!important;
          }
          .tabSubscribeFooter a{
            display:none !important;
          }
          body, .tabTabLabels,.tabAuthTabNav,.tabAuthSchemaCollapsed,.tabAuthToolbar, .tabAuthLeftPanel, .tabAuthLeftViewArea, .tabAuthTabArea, .tabAuthTabStatusBar, .tabAuthTab{
            background-color: transparent !important;
          }
          .tabAuthMenubarArea {
            background-color: #123655 !important;
          }
        `
        addStyle(idoc,css);
    })
  }

  function getToken(){
    var token="";
    $("iframe").each(function( index ) {
      token =this.contentWindow.document.cookie.split("=")[1]
    });
    return token;
  }

  function sendVizPortalPOST(method,params){
    return new Promise( (resolve,reject) => {
      var dt=`{"method":"${method}","params":${params}}`;
      $.ajax({
        url:"/vizportal/api/web/v1/"+method,
        type:"POST",
        headers: {"X-XSRF-TOKEN":getToken()},
        data:dt,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(data){
          resolve(data)
          }
      })
    })
  }

  function overrideElementStyleInIframe(elemSelector,style,retry){
    if (retry==0)
      retryElement=0;
    if (retryElement==500)
      return;
    $("iframe").each(function( index ) {
      var elem=this.contentWindow.document.querySelector(elemSelector);
      if(elem==null){
        setTimeout(() => {
          retryElement=retryElement+1;
          overrideElementStyleInIframe(elemSelector,style,retryElement);
        }, 10);
      }
      else{
        style.forEach(st => {
          elem.style[st.prop] = st.value; 
        });
      }  
    });
  }

  function hideElementInIframe(elemSelector,remove=false,retry){
    if (retry==0)
      retryElement=0;
    if (retryElement==30)
      return;
    $("iframe").each(function( index ) {
      var elem=this.contentWindow.document.querySelector(elemSelector);
      if(elem==null){
        setTimeout(() => {
          console.log("hide retry",retryElement, remove);
          retryElement=retryElement+1;
          hideElementInIframe(elemSelector,remove,retryElement);
        }, 1);
      }
      else{
        if(remove==true)
          elem.parentNode.removeChild(elem);
        else
          elem.style.display = 'none'; 
      }  
    });
  }

  function getSubscriptions(){
    return new Promise( (resolve,reject) => {
      sendVizPortalPOST("getSessionInfo","{}").then((res)=>{
        workbook=viz.getWorkbook();
        var params=`{
            "filter": {
              "operator": "and",
              "clauses": [
                {
                  "operator": "eq",
                  "field": "ownerId",
                  "value": "${res.result.user.id}"
                }
              ]
            },
            "order": [
              {
                "field": "subject",
                "ascending": true
              }
            ],
            "page": {
              "startIndex": 0,
              "maxItems": 100
            }
        }`;
        sendVizPortalPOST("getSubscriptions",params).then((data)=>{
          resolve( data.result);
        })
      })
    })
  }

  function getAlertsForCurrentView(){
    return new Promise( (resolve,reject) => {
      workbook=viz.getWorkbook();
      sendVizPortalPOST("getViewByPath",`{"path":"${workbook.getActiveSheet().getUrl().split("views/")[1]}"}`).then((data)=>{
        sendVizPortalPOST("getDataAlertsForView",`{"viewId":"${data.result.id}"}`).then((data)=>{
          resolve( data.result.dataAlerts);
        })
      })
    })
    
    //SEEMS ALL ALERTS ARE RETURNED WHEN DEALING WITH ORIGINAL OR CUSTOM VIEW...
    //manage if there's no custom views 
    // workbook.getCustomViewsAsync().then((views)=>{
    //   var curView=workbook.getActiveCustomView();
    //   if(curView!=null){
    //     console.log(curView.getName());
    //     sendVizPortalPOST("getViewByPath",`{"path":"${curView.getUrl().split("views/")[1]}"}`).then((data)=>{
    //       sendVizPortalPOST("getDataAlertsForView",`{"viewId":"${data.result.id}"}`).then((data)=>{
    //         console.log(data.result.dataAlerts);
    //       })
    //     })
    //   }
    //   else{
    //     //get viewID with url path
        
    //   }
    // });
  }

  function clearCookie(){
    var map,clone,contextTab;
    $("iframe").each(function( index ) {
      window.tab=contextTab;
        console.log( index + ": " + this.contentWindow.document);
        ifwind=this.contentWindow;
        // if(this.contentWindow.document.getElementById("tabZoneId47").style.display=="none")
        //   this.contentWindow.document.getElementById("tabZoneId47").style.display='';
        // else
        //   this.contentWindow.document.getElementById("tabZoneId47").style.display="none"
        // token =this.contentWindow.document.cookie.split("=")[1];
        var contextTab=this.contentWindow.tab;
        var tabod=$(this.contentWindow.document.body);
        var idoc=this.contentWindow.document;
        var css=`
          .tabAuthLeftViewAreaResizer,.tab-schemaCommon,.tab-dataSources, .tab-Section, .tabButton, .rightEdge, .tabAuthSchemaCollapse, .tabAuthTabNav, .tabAuthLeftViewArea, .tabTabLabel, .tabAuthTab, .tabAuthTabStatusBar{
            border:none!important;
          }
          .tabSubscribeFooter a{
            display:none !important;
          }
          body, .tabTabLabels,.tabAuthTabNav,.tabAuthSchemaCollapsed,.tabAuthToolbar, .tabAuthLeftPanel, .tabAuthLeftViewArea, .tabAuthTabArea, .tabAuthTabStatusBar, .tabAuthTab{
            background-color: transparent !important;
          }
          .tabAuthMenubarArea {
            background-color: #123655 !important;
          }
          // .FIItem.FISelected{
          //   background-color:transparent !important;
          // }
          // .tab-textRegion-boundary{
          //   background-color:transparent !important;
          // }
          // .tab-zone-padding{
          //   background-color:transparent !important;
          // }
          // .tab-zone-margin{
          //   background-color:transparent !important;
          // }
          // .dijitButton{
          //   background-color:transparent !important;
          // }
        `
        addStyle(idoc,css);
        // map=this.contentWindow.document.getElementById("tabZoneId85");
        // map=$(map);
        // tabod.find("*").each(function( index ) {
        //   console.log( index );
        //   $(this).css("background-color","transparent");
        // });
        //clone = map.cloneNode(true);
      });
      
      //document.getElementById("cloneobj").appendChild(clone);
    //https://10.177.51.176/vizportal/api/web/v1/logout
    // var token="";
    // var ifwind;
    // $("iframe").each(function( index ) {
    //   console.log( index + ": " + this.contentWindow.document);
    //   ifwind=this.contentWindow;
    //   token =this.contentWindow.document.cookie.split("=")[1]
    // });
    // $.ajax({
    //   url:"/vizportal/api/web/v1/logout",
    //   type:"POST",
    //   headers: {"X-XSRF-TOKEN":token},
    //   data:'{"method":"logout","params":{}}',
    //   contentType:"application/json; charset=utf-8",
    //   dataType:"json",
    //   success: function(data){
    //     if(data) {
    //      // alert( "Data Loaded: " + data );
    //       logout(token,ifwind,data.result.redirectUrl)
    //     }
    //   }
    // })
    // $("iframe").each(function( index ) {
    //   console.log( index + ": " + this.contentWindow.document);
    // });
  }

  function deleteArtefacts(){
    var toDel="";
    $(".form-check-input-mgt").each((index,input)=>{
      if($(input).prop("checked")==true)
        toDel+=`"${$(input).prop("id")}",`
    })
    if (toDel.length>0){
      toDel=toDel.substring(0,toDel.length-1)
      if($("#modalMgt").prop("tpart")=="alert")
        sendVizPortalPOST("deleteDataAlerts",`{"ids":[${toDel}]}`).then((data)=>{
          console.log(data)
        })
      else{
        sendVizPortalPOST("deleteSubscriptions",`{"ids":[${toDel}]}`).then((data)=>{
          console.log(data)
        })
      }  
    }
  }

  function showSubscriptionMgmt(){
    //TODO filter by ownerID ??
    $("#modalMgt").prop("tpart","subscrip");
    $('#listartefact').empty();
    $('#modalTitle').html("Manage My Subscriptions");
    getSubscriptions().then((result)=>{
      result.subscriptions.forEach(element => {
        var tpAlert=` 
        <div class="form-check">
          <input class="form-check-input-mgt" type="checkbox" value="" id="${element.id}">
          <label class="form-check-label" for="${element.id}">
            ${element.subject}
          </label>
        </div>`
        $('#listartefact').append(tpAlert);
      });
    });
  }

  function showDataAlertMgmt(){
    //TODO filter by ownerID ??
    $("#modalMgt").prop("tpart","alert");
    $('#listartefact').empty();
    $('#modalTitle').html("Manage My Alerts");
    getAlertsForCurrentView().then((alerts)=>{
      alerts.forEach(element => {
        var tpAlert=` 
        <div class="form-check">
          <input class="form-check-input-mgt" type="checkbox" value="" id="${element.id}">
          <label class="form-check-label" for="${element.id}">
            ${element.title}
          </label>
        </div>`
        $('#listartefact').append(tpAlert);
      });
    });
  }

  function showDataAlertDialog(){
    viz.showDataAlertDialog();
    var style=[{prop:"background-color",value:"#123655"},{prop:"color",value:"white"}];
    overrideElementStyleInIframe("[data-tb-test-id='dataAlertDialog-Dialog-TitleBar']",style,0);
  }

  function showSubscription(){
    viz.showSubscriptionDialog();
    hideElementInIframe(".fvdiwns.tab-manageSubscribers",true,0);
    var style=[{prop:"background-color",value:"#123655"},{prop:"color",value:"white"}];
    overrideElementStyleInIframe("[data-tb-test-id='subscribe-Dialog-TitleBar']",style,0);
  }

  function showCustomViews(){
    viz.showCustomViewsDialog();
    var style=[{prop:"background-color",value:"#123655"},{prop:"color",value:"white"}];
    overrideElementStyleInIframe("[data-tb-test-id='customViews-Dialog-TitleBar']",style,0);
  }

  function exportPDF() {
    viz.showExportPDFDialog();
    var style=[{prop:"background-color",value:"#123655"},{prop:"color",value:"white"}];
    overrideElementStyleInIframe("[data-tb-test-id='PdfDialog-Dialog-TitleBar']",style,0);
  }

  function exportData() {
    viz.showExportCrossTabDialog();
    var style=[{prop:"background-color",value:"#123655"},{prop:"color",value:"white"}];
    overrideElementStyleInIframe("[data-tb-test-id='FileDownload-Dlg-Dialog-TitleBar']",style,0);
  }

  function resetViz() {
    viz.revertAllAsync();
  }

  function launchEdit() {
    $("#mask").show();
    $(".menu").slideToggle(700, ()=>{
      viz.getCurrentUrlAsync().then(function (current_url) {
        edit_url = current_url.split("?")[0].replace("/views", "/authoring");
        edit_options = {
          width: "100%",
          height: "85vh",
          onFirstInteractive: function () {
            var iframe = document.querySelectorAll("iframe")[0];
            iframe.onload = function () {
              $("#mask").show();
              var srcviz=iframe.src.split("?")[0].replace( "/authoring","/views")
              console.log(iframe.src.split("?")[0].replace( "/authoring","/views"));
              loadViz(placeholderDiv, srcviz, options,"");
              //loadViz(placeholderDiv, this.contentWindow.location.href.split("?")[0], options,"");
            };
            pimpedit();
            $("#mask").fadeOut(maskDelay,()=>{});
          },
        };
        loadViz(placeholderDiv, edit_url, edit_options);
      });
    });
  }

  function findFilterSheet(sheetName) {
    workbook = viz.getWorkbook();
    activeSheet = workbook.getActiveSheet();

    switch (activeSheet.getSheetType()) {
      case "worksheet":
        // just a worksheet so assume the filter lives on this sheet
        activeFilterSheet = activeSheet;
        break;
      case "dashboard":
        worksheets = activeSheet.getWorksheets();
        for (i = 0; i < worksheets.length; i++) {
          switch (worksheets[i].getName()) {
            case sheetName:
              //Found the sheet we need!
              activeFilterSheet = worksheets[i];
              break;
          }
        }
        break;
      case "story":
        // story so wont filter on it
        break;
    }
  }

