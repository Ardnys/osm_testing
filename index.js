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
	const save_img_button = document.getElementById("save-image-button");
	const clear_canvas_button = document.getElementById("clear-canvas-button");
	file_submit_button.addEventListener("click", () => {
		const file = file_thing.files?.[0];
		if (file) {
			on_read_file(file);
		}
	});
	save_img_button.addEventListener("click", () => {
		var img = new Image();
		img.src = document.getElementById("canvas").toDataURL("image/png");
		document.body.appendChild(img);
	});
	clear_canvas_button.addEventListener("click", () => {
		var ctx = document.getElementById("canvas").getContext("2d");
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	});
};

const ll_to_xy = () => {};

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
			// TODO: make them proper pls
			var maxlat = 0,
				maxlon = 0,
				minlat = 100,
				minlon = 100;
			var screenHeight = 600.0;
			var screenWidth = 800.0;

			var lats_lons = new Map();
			var ways = [];

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
					var id = parseInt(attr["id"].value);

					minlon = Math.min(lon, minlon);
					minlat = Math.min(lat, minlat);
					maxlon = Math.max(lon, maxlon);
					maxlat = Math.max(lat, maxlat);

					var tags = node.children;
					// TODO: handle this in a nicer way pls
					// for (let j = 0; j < tags.length; j++) {
					// 	console.log(tags[j].attributes["k"].nodeValue);
					// 	console.log(tags[j].attributes["k"] === "k=name");
					// 	var key = tags[j].attributes["k"].nodeValue;

					// TODO: this is gonna be larger probably
					const n = {
						lat: lat,
						lon: lon,
						size: size,
					};

					var size = 1;
					lats_lons.set(id, n);
				} else if (name === "way") {
					var id = attr["id"].value;
					var nds = node.children;
					var refs = [];
					var name = "";
					for (let j = 0; j < nds.length; j++) {
						var way_ref = nds[j].attributes["ref"];
						var way_name = nds[j].attributes["name"];
						if (way_ref) {
							var ref_id = parseInt(way_ref.nodeValue);
							refs.push(ref_id);
						}
						if (way_name) {
							name = way_name.nodeValue;
						}
					}
					const w = {
						id: id,
						refs: refs,
						name: name,
					};
					ways.push(w);
				}
			}
			// console.log(
			// 	`minlat: ${minlat}, maxlat: ${maxlat}, minlon: ${minlon}, maxlon ${maxlon}`
			// );

			ctx.translate(0, canvas.height); // Move the origin to the bottom-left
			ctx.scale(1, -1); // Flip the Y-axis
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "white";

			// render points
			for (let [id, n] of lats_lons) {
				var slope_lat = (1.0 * screenHeight) / (maxlat - minlat);
				var slope_lon = (1.0 * screenWidth) / (maxlon - minlon);

				x = slope_lon * (n.lon - minlon);
				y = slope_lat * (n.lat - minlat);

				// console.log(`x: ${x}, y: ${y}`);

				// ctx.fillRect(x, y, n.size, n.size);
			}

			// render ways
			for (let i = 0; i < ways.length; i++) {
				const w = ways[i];

				ctx.beginPath();
				ctx.lineWidth = 0.5;
				ctx.strokeStyle = "#ffffff";
				var count = 0;

				for (const r of w.refs) {
					var node = lats_lons.get(r);

					var slope_lat = (1.0 * screenHeight) / (maxlat - minlat);
					var slope_lon = (1.0 * screenWidth) / (maxlon - minlon);

					x = slope_lon * (node.lon - minlon);
					y = slope_lat * (node.lat - minlat);
					if (count == 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}

					count += 1;
				}

				ctx.stroke();
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
