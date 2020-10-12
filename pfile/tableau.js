
  var viz, edit;
  var check,ismodif;
  var maskDelay=200;
  var retryElement=0
  var workbook,
    activeSheet,
    selectedMarks,
    options,
    placeholderDiv,
    activeFilterSheet;
  var alertTM,subTM;  
  const VIZ_HEIGHT=0.85;


  function test(){
      var idoc=$("#tableauViz iframe")[0].contentWindow.document;
      var ts=idoc.querySelector("#tsConfigContainer");
      var sess=JSON.parse(ts.innerHTML).sessionid;
      $.ajax({
        url:`/vizql/w/Superstore/v/Overview/sessions/${sess}/commands/tabdoc/open-metrics-panel`,
        type:"POST",
        headers: {"X-Tsi-Active-Tab":"Overview"},
        data:"",
        contentType:"multipart/form-data; boundary=Hnnptf74",
        dataType:"json",
        success: function(data){
          console.log(data);
          }
      })
  }
  
  function loadVizInit() {
    //url="http://10.177.51.176/#/views/Superstore/Overview?:render=true&:jsdebug=n";
    url="http://10.177.51.176/#/views/Regional/Economy?:render=true&:jsdebug=n"
    placeholderDiv = document.getElementById("tableauViz");
    options = {
      width: "100%",
      height: `${VIZ_HEIGHT*100}vh`,
      hideTabs: true,
      hideToolbar: true,
      onFirstInteractive: function () {
        pimpdash();
        $("#myCarousel").carousel("pause");
        setTimeout(() => {
          preloadEdit();
        }, 1000);
        //findFilterSheet("Sector Comparison");
        $("#mask").fadeOut(maskDelay,()=>{});
        // findFilterSheet("Investor AUM & Performance");
      },
    };
    loadViz(placeholderDiv, url, options);
  }

  function computeViewPortSize(){
    var sz=$("#tableauViz").width();
    var hg=$(window).height() * VIZ_HEIGHT;
    $("#preload").on("error",()=>{
      $("#preload").hide();
    })
    $("#preload").on("load",()=>{
      $("#preload").prop("height",$("#preload").naturalHeight);
      $("#preload").prop("width",$("#preload").naturalWidth);
    })
    $("#preload").prop("src",`http://10.177.51.176/views/Superstore/Overview.png?:highdpi=true&:size=${sz},${hg}`);
    console.log(sz,hg)
  }
  
  function loadViz(placeholderDiv, url, options,menushow) {

    function go(){
      if (viz) {
        viz.dispose();
      }
      clearInterval(check);
      viz = new tableau.Viz(placeholderDiv, url, options);
      check=setInterval(()=>{
        var idoc=$("#tableauViz iframe")[0].contentWindow.document;
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
    var idoc=$("#tableauViz iframe")[0].contentWindow.document;
    var css=`
      .FIItem.FISelected{
        background-color:transparent !important;
      }
      .tab-textRegion-boundary{
        background-color:transparent !important;
        border-style:none !important;
      }
      .tab-zone-padding{
        background-color:transparent !important;
        border-style:none !important;
      }
      .tab-zone-margin{
        background-color:transparent !important;
      }
      .dijitButton{
        background-color:transparent !important;
      }
      div[data-tb-test-id="FileDownload-Dlg-Dialog-TitleBar"]{
        background-color:#123655 !important;
        color:white !important;
      }
      div[data-tb-test-id="PdfDialog-Dialog-TitleBar"]{
        background-color:#123655 !important;
        color:white !important;
      }
      div[data-tb-test-id="customViews-Dialog-TitleBar"]{
        background-color:#123655 !important;
        color:white !important;
      }
      div[data-tb-test-id="subscribe-Dialog-TitleBar"]{
        background-color:#123655 !important;
        color:white !important;
      }
      div[data-tb-test-id="dataAlertDialog-Dialog-TitleBar"]{
        background-color:#123655 !important;
        color:white !important;
      }
      .fvdiwns.tab-manageSubscribers{
        display:none !important;
      }
    `
    addStyle(idoc,css);
  }

  function reloadVizAfterSave(){
    if (viz) {
      viz.dispose();
    }
    $("#mask").show();
    viz = new tableau.Viz(placeholderDiv, url, options);
  }

  function pimpedit(){
    var idoc=$("#tableauEdit iframe")[0].contentWindow.document;
    $(idoc.getElementsByClassName("tabAuthMenuBarExitButton")[0]).click((e)=>{
      check=setInterval(()=>{
        var idoc=$("#tableauEdit iframe")[0].contentWindow.document;
        var sv=idoc.querySelector('button[data-tb-test-id="tab-confirmation-confirm-Button"]')
        if(sv!=null){
          clearInterval(check);
          $(idoc.querySelector('button[data-tb-test-id="tab-confirmation-confirm-Button"]')).click((e)=>{
            $(".editbtn").prop("disabled","true");
            reloadVizAfterSave();
            showEdit(false);
          })
          $(idoc.querySelector('button[data-tb-test-id="tab-confirmation-deny-Button"]')).click((e)=>{
            showEdit(false);
          })
        }
      },100)  
    })
    $(".close.edit").click((e)=>{
      showEdit(false);  
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
      .tab-Icon.tabAuthMenuBarExitButton{
        display:none;
      }
      .tab-dialogTitleBar{
        background-color: #123655 !important;
        color:white !important;
      }
      .tabAuthMenuBarWorkbook{
        opacity:0 !important;
      }
    `
    addStyle(idoc,css);
  }

  function getToken(){
    var token="";
    token =$("#tableauViz iframe")[0].contentWindow.document.cookie.split("=")[1]
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
  }

  function clearCookie(){     
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
  }

  function showSubscription(){
    viz.showSubscriptionDialog();
  }

  function showCustomViews(){
    viz.showCustomViewsDialog();
  }

  function exportPDF() {
    viz.showExportPDFDialog();
  }

  function exportData() {
    viz.showExportCrossTabDialog();
  }

  function resetViz() {
    viz.revertAllAsync();
  }

  function isEditModified(){
    var idoc=$("#tableauEdit iframe")[0].contentWindow.document;
    var test=idoc.querySelector(".tabToolbarButton.tab-widget.undo.disabled");
    return test==null;
  }

  function showEdit(visible){
    clearInterval(ismodif);
    $("#myCarousel").carousel("pause");
    $("#myCarousel").carousel("next");
    if((!$(".menu").is(":visible") && visible==false) ){
      $(".close.edit").hide();
      $(".menu").slideToggle(500);
    }
    if(($(".menu").is(":visible") && visible==true) ){
      $(".menu").slideToggle(500,()=>{
        $(".close.edit").show();
      });
      ismodif=setInterval(() => {
        if(isEditModified()){
          var idoc=$("#tableauEdit iframe")[0].contentWindow.document;
          $(idoc.querySelector(".tab-Icon.tabAuthMenuBarExitButton")).show();
          $(".close.edit").hide();
        }
        else{
          var idoc=$("#tableauEdit iframe")[0].contentWindow.document;
          $(idoc.querySelector(".tab-Icon.tabAuthMenuBarExitButton")).hide();
          $(".close.edit").show();
        }
      }, 500);
    }
  }

  function preloadEdit(){
    if(edit)
      edit.dispose()
    var placeholderEdit = document.getElementById("tableauEdit");
    viz.getCurrentUrlAsync().then(function (current_url) {
      edit_url = current_url.split("?")[0].replace("/views", "/authoring");
      edit_options = {
        width: "100%",
        height: "85vh",
        onFirstInteractive: function () {
          var iframe = $("#tableauEdit iframe")[0];
          $(".prel").show();
          setTimeout(() => {
            $(".prel").css("display","");
            $(".editbtn").removeAttr("disabled");
          }, 4000);
          iframe.onload = function () {
            setTimeout(() => {
              preloadEdit();
            }, 500);
          };
          pimpedit();
        },
      };
      edit=new tableau.Viz(placeholderEdit, edit_url, edit_options);
    });
  }

  function launchEdit() {
    showEdit(true);
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

