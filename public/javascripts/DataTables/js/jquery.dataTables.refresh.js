$.fn.dataTableExt.oApi.fnReloadAjax = function(oSettings)
{
	this.fnClearTable(this);
    this.oApi._fnProcessingDisplay(oSettings, true );
    var that = this;   
    $.getJSON(oSettings.sAjaxSource, null, function(json){
        for (var i=0; i<json.aaData.length; i++)
        {
            that.oApi._fnAddData(oSettings, json.aaData[i]);
        }
        oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
        that.fnDraw(that);
        that.oApi._fnProcessingDisplay(oSettings, false);
    });
};
