(function (window, document, undefined) {
	// code that should be taken care of right away
	window.onload = init;
	function init() {
		setup_things();
	}
})(window, document, undefined);
const setup_things = () => {
	const file_thing = document.getElementById("file-selector");
	const file_submit_button = document.getElementById("file-submit-button");
	file_submit_button.addEventListener("click", () => {
		const file = file_thing.files?.[0];
		if (file) {
			on_read_file(file);
		}
	});
};
const on_read_file = (file) => {
	if (file) {
		console.log("reading the file: " + file.name);
		var reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = (event) => {
			// parse
			console.log("parsing the file");
			var parser = new DOMParser();
			var map_xml = parser.parseFromString(event.target?.result, "text/xml");
			var osm_root = map_xml.children[0];
			var nodes = osm_root.children;
			var maxlat = 0,
				maxlon = 0,
				minlat = 100,
				minlon = 100;
			var screenHeight = 600.0;
			var screenWidth = 800.0;
			var lats_lons = [];
			var c = document.getElementById("canvas");
			var ctx = c.getContext("2d");
			for (let i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				var name = node.localName;
				var attr = node.attributes;
				// node.localName  gives us the name (like bounds, node, etc.)
				// node.attributes gives us attributes (like lat, long, timestamp etc.)

				if (name === "node") {
					var lat = attr["lat"].value;
					var lon = attr["lon"].value;
					if (lon < minlon) {
						minlon = lon;
					}
					if (lon > maxlon) {
						maxlon = lon;
					}
					if (lat < minlat) {
						minlat = lat;
					}
					if (lat > maxlat) {
						maxlat = lat;
					}
					lats_lons.push([lat, lon]);
				}
			}
			// console.log(
			// 	`minlat: ${minlat}, maxlat: ${maxlat}, minlon: ${minlon}, maxlon ${maxlon}`
			// );

			for (let i = 0; i < lats_lons.length; i++) {
				const [lat, lon] = lats_lons[i];
				var slope_lat = (1.0 * screenHeight) / (maxlat - minlat);
				var slope_lon = (1.0 * screenWidth) / (maxlon - minlon);

				x = slope_lon * (lon - minlon);
				y = slope_lat * (lat - minlat);

				// console.log(`x: ${x}, y: ${y}`);

				ctx.fillRect(x, y, 1, 1);
			}

			// console.log(osm_root);
		};
		reader.onerror = (event) => {
			alert("could not read the file");
		};
	} else {
		console.log("file is null");
	}
};
