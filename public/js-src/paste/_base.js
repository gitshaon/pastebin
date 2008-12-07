dojo.provide("paste._base");

(function() {
    paste.activeStatusTabs = ["about", "active", "new-paste"];

    paste.findParentForm = function(elementNode) {
        while (elementNode.nodeName.toLowerCase() != 'form') {
            elementNode = elementNode.parentNode;
        }
        return elementNode;
    };

    paste.formattedShow = function() {
        dojo.toggleClass("pastecode", "highlight", true);
        dojo.query("#pastecode pre code").forEach(function(node) {
            dojox.highlight.init(node);
        });

        var linkNode = dojo.byId("format-toggle");
        dojo.attr(linkNode, "onClick", "paste.unformattedShow()");
        linkNode.innerHTML = "unformatted";
    };

    paste.prepareFollowupForm = function() {
        var followupform = dojo.byId("followupform");
        spindle.prepareForm(followupform);
        dojo.connect(followupform, "onsubmit", paste, "processFollowupForm");
    };

    paste.prepareNewPasteForm =  function() {
        var pasteform = dojo.byId("pasteform");
        spindle.prepareForm(pasteform);
        dojo.connect(pasteform, "onsubmit", paste, "processNewForm");
    };

    paste.processFollowupForm = function(e) {
        e.preventDefault();
        var form = dijit.byId("followupform");
        return paste._processForm(form);
    };    

    paste.processNewForm = function(e) {
        e.preventDefault();
        var form = dijit.byId("pasteform");
        return paste._processForm(form);
    };

    paste.setStatusFromMetadata = function() {
        var metadata = dojo.byId("metadata");
        if (!metadata) {
            return;
        }
        var footer = dijit.byId("footer");
        footer.attr('content', "<p>" + metadata.innerHTML + "</p>");
    };

    paste.setTitle = function(title) {
        spindle.setTitle(title + ' - Pastebin');
    };

    paste.unformattedShow = function() {
        dojo.toggleClass("pastecode", "highlight", false);
        var linkNode = dojo.byId("format-toggle");
        dojo.attr(linkNode, "onClick", "paste.formattedShow()");
        linkNode.innerHTML = "formatted";
    };

    paste.updateStatus = function(tab) {
        var id = tab.domNode.id;
        if (-1 != paste.activeStatusTabs.indexOf(id)) {
            var service = paste._getService();
            service.fetchActiveCount()
                .addCallback(function(count){
                    var footer = dijit.byId("footer");
                    footer.attr('content', '<p>' + count + " active pastes</p>");
                });
        } else {
            paste.setStatusFromMetadata();
        }
    };

    paste.upgrade = function() {
        dojo.forEach([".new-paste", "#paste-nav"],
            function(query, index, array) {
                dojo.query(query).style("display", "none");
            }
        );
        dojo.style("footer", "visibility", "visible");
        dojo.subscribe("pastebin-selectChild", paste, "updateStatus");
    };

    paste._getService = function() {
        if (!paste._service) {
            paste._service = new dojox.rpc.Service(paste.baseUrl + "/api/spindle/paste/content/jsonrpc.smd", {
                envelope:"JSON-RPC-2.0",
            });
        }
        return paste._service;
    };

    paste._prepareForm = function(form) {
        var url  = dojo.attr(form, "action");
        dojo.attr(form, "action", "#");
        dojo.attr(form, "method", "");
        dojo.attr(form, "url", url);
    };

    paste._processForm = function(pasteform) {
        var service = paste._getService();

        var values = spindle.prepareFormElements(pasteform.domNode);

        service.add(values)
            .addCallback(function(data) {
                if (data.success) {
                    paste.tabs.loadPasteTabs(data.success);
                } else if (data.error) {
                    spindle.createErrorDialog(data.messages);
                }
            })
            .addErrback(function(data){
                var errors = [
                    {
                        label:    "General Transport Error: ", 
                        messages: ["A general error occurred; please try again later."],
                    },
                ];
                spindle.createErrorDialog(errors);
            });
    };
})();
