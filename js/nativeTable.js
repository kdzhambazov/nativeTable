$.fn.nativeTable = function(options){
	var defaults = $.extend({
		dataPath: "",
		RecordsShownPerPage: 5,
		textAlignment: "left",
		headerBackground: "#000066",
		evenRowBackground: "#FFFFFF",
		oddRowBackground: "#d9d9d9",
		rowHoverbackground: "#000066"
    }, options);

	var Pagination = function(paginationPage){
		this.paginationPage = paginationPage;
		this.totalPages = 0;
	}

	Pagination.prototype.renderPagination = function(){
		$("#page-wrapper").empty();
		var a = "<a href='#' class='page-number'>";
		var closea = "</a>";
		var i, constantStart = -1, constantEnd = 1;

		if(this.paginationPage == 1){
			constantStart = 0;
			$("#prev").addClass("hide-buttons");
		}
		if(this.paginationPage == this.totalPages){
			constantEnd = 0;
			$("#next").addClass("hide-buttons");
		}

		for(i=this.paginationPage+constantStart; i<=this.paginationPage+constantEnd; i++){
			a = "<a href='#' id='"+i+"'>";
			a += i;
			$("#page-wrapper").append(a);
			$("#page-wrapper").append(closea);
		}
	}

	Pagination.prototype.setTotalPages = function(grid){
		this.totalPages = Math.round(grid.table.length / grid.rowsPerPage);
		if(grid.currentPage > this.totalPages){this.paginationPage = 1; grid.currentPage = 1;}
	}

	Pagination.prototype.onPageClick = function(grid, clickCurrPage){
		grid.currentPage = clickCurrPage;
		this.paginationPage = grid.currentPage;
		grid.setPageEdge();
		grid.renderBody();
		this.renderPagination();

		$("#page-wrapper a").css("font-weight","normal");
		$("#"+grid.currentPage).css({"font-weight":"bold", "font-size":"20px"});
		if($("#prev").toggleClass("hide-buttons")){$("#prev").removeClass("hide-buttons");}
		if($("#next").hasClass("hide-buttons")){$("#next").removeClass("hide-buttons");}

		switch(grid.currentPage){
			case 1:
				$("#prev").addClass("hide-buttons");
				break;
			case this.totalPages:
				$("#next").addClass("hide-buttons");
				break;
		}
		grid.markFound();
	}

	var NumberType = function(name ,value){
		this.name = name;
		this.value = value;
	}

	var StringType = function(name ,value){
		this.name = name;
		this.value = value;
	}

	var DateType = function(name ,value){
		this.name = name;
		this.value = value;
		this.convert = "";
	}

	DateType.prototype.convertTimestamp = function(){
		this.convert = new Date(this.value*1000);
		this.value = this.convert.getDate() + "/" + this.convert.getMonth() + "/" + this.convert.getFullYear();
	}

	var FloatType = function(name ,value){
		this.name = name;
		this.value = value;
	}

	FloatType.prototype.convertDecimalPoint = function(){
		this.value = parseFloat(this.value).toFixed(2);
	}

	var CellFactory = function(){
		this.cell = null;	
	}

	CellFactory.prototype.createCell = function(type, name, value){
		switch(type){
			case "number":
				this.cell = new NumberType(name, value);
				break;
			case "string":
				this.cell = new StringType(name, value);
				break;
			case "timestamp":
				this.cell = new DateType(name, value);
				this.cell.convertTimestamp();
				break;
			case "float":
				this.cell = new FloatType(name, value);
				this.cell.convertDecimalPoint();
				break;
		}
		return this.cell;
	}

	var TableRow = function(colType, name, value, evenOrOdd){
		this.row = new Array();
		this.cell = new CellFactory();
		this.rendered = "yes";
		this.evenOrOdd = evenOrOdd;

		for(var j = 0; j < name.length; j++){
			this.row.push(this.cell.createCell(colType[j], name[j], value[j]));
		}	
	}

	var TableGrid = function(tableDomId){
		this.tableDomId = tableDomId;
		this.table = new Array();
		this.sortBy = "";
		this.sortOrd = 0;
		this.currentPage = 0;
		this.rowsPerPage = 0;
		this.beginRow = 0;
		this.endRow = 0;
		this.searchText = "";
	}

	TableGrid.prototype.fillData = function(){
		var that = this;
		var tempEvenOrOdd = "";

		return $.ajax({
			type: "GET",
			url: defaults.dataPath,
			dataType: "json"
		}).done(function(response){
			for(var i = 0; i < response.records.length; i++){
				tempEvenOrOdd = "odd";
				if((i+1) % 2){tempEvenOrOdd = "even";}
				that.table.push(new TableRow(response.columns.columnTypes, response.columns.headers, response.records[i], tempEvenOrOdd));
			}
			that.sortBy = response.columns.headers[response.orderBy];
			that.getOrd(response.orderType);
			that.rowsPerPage = defaults.RecordsShownPerPage;
			that.currentPage = response.currentPage;
			that.searchText = response.searchText;
		});	
	}

	TableGrid.prototype.renderHead = function(){
		var tr = "<tr>";
		var closetr = "</tr>";
		var property, i;

		for(i=0; i<this.table[0].row.length; i++){
			tr += "<th data-sort='"+this.table[0].row[i].name+"' id='"+this.table[0].row[i].name+"'><i class='fa fa-sort-asc'></i><span>" + this.table[0].row[i].name + "</span></th>";
		}
		$("#"+this.tableDomId).append(tr);
		$("#"+this.tableDomId).append(closetr);
	}

	TableGrid.prototype.renderBody = function(){
		$("#"+this.tableDomId+" tr td").remove();
		var tr = "<tr>";
		var closetr = "</tr>";
		var j, i;

		for(i=this.beginRow; i<this.endRow; i++){
			tr = "<tr style='background-color: "+defaults.evenRowBackground+"' class='even'>";
			if(this.table[i].evenOrOdd === "odd"){
				tr = "<tr style='background-color: "+defaults.oddRowBackground+"'  class='odd'>";
			}
			if(this.table[i].rendered === "yes"){				
				for(j=0; j<this.table[i].row.length; j++){
					tr += "<td>" + this.table[i].row[j].value + "</td>";
				}
				$("#"+this.tableDomId).append(tr);
				$("#"+this.tableDomId).append(closetr);
			}
		}
	}

	TableGrid.prototype.setStyle = function(){
		$("#"+this.tableDomId+" tr td").each(function(index) {
			$(this).css("text-align",defaults.textAlignment);
		});
		$("#"+this.tableDomId+" tr th").each(function(index) {
			$(this).css("background-color",defaults.headerBackground);
		});
	}

	TableGrid.prototype.searchTable = function(){
		var j, i;
		var tempFlag = 0;
		if($("#searchBox").val().length >= 3 || $("#searchBox").val().length == 0){
			this.searchText = $("#searchBox").val();
			for(i=0; i<this.table.length; i++){
				for(j=0; j<this.table[i].row.length; j++){
					tempFlag = 0;
					if(String(this.table[i].row[j].value).indexOf($("#searchBox").val()) != -1 || String(this.table[i].row[j].value).toLowerCase().indexOf($("#searchBox").val()) != -1){
						var tempFlag = 1;
						break;
					}
				}
				if(tempFlag == 0){this.table[i].rendered = "no";}
				if($("#searchBox").val().length == 0){this.table[i].rendered = "yes";}
			}
		}
	}

	TableGrid.prototype.markFound = function(){
		if($("#searchBox").val().length >= 3){
			$("#"+this.tableDomId+" tr td").each(function(index) {
				var reg = new RegExp($("#searchBox").val(), 'gi');
				$(this).html($(this).html().replace(reg, function(str) {return '<b class="highlight">'+str+'</b>'}));
			});
			$(".highlight").css("background-color",defaults.headerBackground);
		}
	}

	TableGrid.prototype.getSortIndex = function(){
		for(i=0; i<this.table[0].row.length; i++){
			if(this.sortBy == this.table[0].row[i].name){
				return i;
			}
		}
	}

	TableGrid.prototype.sortBody = function(){
		var that = this;

		$("#"+this.tableDomId+" tr th i").css("display", "none");
		$("#"+this.sortBy).find("i").css("display", "inline");
		$("#"+this.sortBy).find("i").removeClass("fa-sort-asc fa-sort-desc");

		if(this.sortOrd === 1){
			$("#"+this.sortBy).find("i").addClass("fa-sort-desc");
			this.table.reverse();
			return 0;
		}			
		$("#"+this.sortBy).find("i").addClass("fa-sort-asc");
		this.table.sort(function (a, b) {				
			if(this.sortBy === "Date"){return new Date(a.row[that.getSortIndex()].value).getTime() - new Date(b.row[that.getSortIndex()].value).getTime();}
			if(a.row[that.getSortIndex()].value > b.row[that.getSortIndex()].value){return 1;}
			if(a.row[that.getSortIndex()].value < b.row[that.getSortIndex()].value){return -1;}
			return 0;
		});
	}

	TableGrid.prototype.getOrd = function(ordType){
		this.sortOrd = 0;
		if(ordType === "DESC"){this.sortOrd = 1;}
	}

	TableGrid.prototype.setPageEdge = function(){
		this.endRow = this.rowsPerPage * this.currentPage;
		this.beginRow = this.endRow - this.rowsPerPage;
		if(this.endRow > this.table.length){this.endRow = this.table.length;}
	}

	TableGrid.prototype.createPagination = function(){
		return new Pagination(this.currentPage);
	}

	var grid = new TableGrid(this['0'].id);
	var paging;
	grid.fillData().done(function(){
		$("#searchBox").val(grid.searchText);
		paging = grid.createPagination();
		grid.renderHead();
		paging.setTotalPages(grid);
		grid.setPageEdge();
		grid.searchTable();
		grid.renderBody();
		grid.setStyle();
		grid.markFound();
		paging.renderPagination();
		$("#"+String(grid.currentPage)).css({"font-weight":"bold", "font-size":"20px"});
	});

	$("#"+grid.tableDomId).on('click','tr th',function(){ 
		grid.sortBy = $(this).attr("data-sort");
		if(grid.sortOrd === 0){
			grid.sortOrd = 1;
		}else{
			grid.sortOrd = 0;
		}
		grid.sortBody();
		grid.renderBody();
	});

	$("#page-wrapper").on('click','a',function(){
		paging.onPageClick(grid, parseInt($(this).text()));
	});

	$("#prev").on('click',function(){
		paging.onPageClick(grid, grid.currentPage-1);
	});

	$("#next").on('click',function(){
		paging.onPageClick(grid, grid.currentPage+1);
	});

	$("#searchMe").on('click',function(){
		grid.searchTable();
		grid.renderBody();
		grid.markFound();
	});

	$("#searchBox").on('keydown',function(event){		
		grid.searchTable();
		grid.renderBody();
		if(event.which == 13){grid.markFound();}
	});

	$("#"+grid.tableDomId).on("mouseover","tr th",function(){ 
		$(this).css({"background-color":"#FFFFFF","color":defaults.headerBackground});
	});

	$("#"+grid.tableDomId).on("mouseout","tr th",function(){ 
		$(this).css({"background-color":defaults.headerBackground,"color":"#FFFFFF"});
	});

	$("#"+grid.tableDomId).on("mouseout","tr",function(){
		$(this).css({"background-color":defaults.evenRowBackground,"color":"#000000"});
		if($(this).hasClass("odd")){$(this).css("background-color",defaults.oddRowBackground);}
	});

	$("#"+grid.tableDomId).on("mouseover","tr",function(){ 
		$(this).css({"background-color":defaults.rowHoverbackground,"color":"#FFFFFF"});
	});
};