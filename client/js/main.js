// Globals
var pages = {
	home: {
	},
	projects: {
		beforeShow: function(pageNode) {
			d3.json("/api/projects", function(error, data) {
				if(error) {
					console.error(error);
				} else if(data) {
					d3.select(pageNode).render(data);
				}
			});
		}
	},
	members: {
	}
};

// Show page
function showPage(id) {

	// Select only single page
	var page = undefined;
	var pageNode = undefined;
	d3.selectAll(".page").classed("selected", function() {
		if(d3.select(this).attr("id") === id) {

			// Perform initialization before showing page
			pageNode = this;
			page = pages[id];
			if(page && page.beforeShow) {
				page.beforeShow(pageNode);
			}
			return true;
		}
		return false;
	});

	// Perform initialization after showing page
	if(page && page.afterShow) {
		page.afterShow(pageNode);
	}
}

function initializeAfterLoad() {

	// Add event handlers to links
	d3.selectAll("a").each(function() {
		var link = d3.select(this);
		var href = link.attr("href");
		if(href.startsWith("#")) {
			link.on("click", function() {
				showPage(href.slice(1));	// Remove "#"
				stopEventFully();
			});
		}
	});

	// Create templates from pages
	d3.selectAll(".page").template();

	// Show home page
	showPage("home");
}

function stopEventFully() {
	d3.event.stopPropagation();
	d3.event.preventDefault();
}

window.addEventListener("load", function() {
	initializeAfterLoad();
});
