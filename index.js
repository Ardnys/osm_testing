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
			var space = init_space();

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

					space.minlon = Math.min(lon, space.minlon);
					space.minlat = Math.min(lat, space.minlat);
					space.maxlon = Math.max(lon, space.maxlon);
					space.maxlat = Math.max(lat, space.maxlat);

					// TODO: this is gonna be larger probably
					const n = {
						lat: lat,
						lon: lon,
					};

					space.node_map.set(id, n);
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
					space.edge_array.push(w);
				}
			}
			var translatePos = { x: 0, y: 0 };
			var scale = 1;
			var delta = 0.2;

			document.getElementById("plus").addEventListener(
				"click",
				function () {
					scale = Math.min(Math.max(scale + delta, 0.1), 5);
					draw(scale, translatePos, space);
				},
				false
			);

			document.getElementById("minus").addEventListener(
				"click",
				function () {
					scale = Math.min(Math.max(scale - delta, 0.1), 5);
					draw(scale, translatePos, space);
				},
				false
			);
			draw(scale, translatePos, space);
		};
		reader.onerror = (event) => {
			alert("could not read the file");
		};
	} else {
		console.log("file is null");
	}
};

// TODO: factor this out in a nice way
const init_space = () => {
	return {
		maxlat: 0,
		maxlon: 0,
		minlat: 90,
		minlon: 90,
		screenHeight: 600,
		screenWidth: 800,
		node_map: new Map(),
		edge_array: [],
	};
};

const ll_to_xy = (space, n) => {
	var slope_lat = (1.0 * space.screenHeight) / (space.maxlat - space.minlat);
	var slope_lon = (1.0 * space.screenWidth) / (space.maxlon - space.minlon);

	x = slope_lon * (n.lon - space.minlon);
	y = slope_lat * (n.lat - space.minlat);
	return [x, y];
};

const draw = (scale, tranlatePos, space) => {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setTransform(1, 0, 0, 1, 0, 0);

	console.log(`scale: ${scale}`);
	ctx.translate(tranlatePos.x, tranlatePos.y);
	ctx.scale(scale, scale);
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "white";

	draw_edges(space, ctx);
};

const draw_nodes = (space, ctx) => {
	// render points
	for (let [id, n] of space.node_map) {
		const [x, y] = ll_to_xy(space, n);
		// console.log(`x: ${x}, y: ${y}`);
		// ctx.fillRect(x, y, n.size, n.size);
	}
};

const draw_edges = (space, ctx) => {
	// render ways
	for (let i = 0; i < space.edge_array.length; i++) {
		const w = space.edge_array[i];

		ctx.beginPath();
		ctx.lineWidth = 0.5;
		ctx.strokeStyle = "#ffffff";
		var count = 0;

		for (const r of w.refs) {
			var node = space.node_map.get(r);

			const [x, y] = ll_to_xy(space, node);

			if (count == 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}

			count += 1;
		}

		ctx.stroke();
	}
};
