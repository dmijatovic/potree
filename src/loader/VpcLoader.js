import {PointCloudCopcGeometryNode,PointCloudCopcGeometry} from "../PointCloudCopcGeometry"
import {PointCloudOctree} from "../PointCloudOctree.js";

/**
 * Use CopcLoader when *.copc.laz file are used
 * NOTE! We need to adjust the elevationRange based
 * on values calculated for each file
 */
export class VpcLoader{
	static async load(file, callback) {
		const {Copc,Getter} = window.Copc
		const vpcPointclouds = []
		let minRange, maxRange

		// load vpc json file
		const response = await fetch(file)
		if(!response.ok) {
			console.error(`Failed to load file form ${file}`);
			callback(null);
			return;
		}
		const vpc = await response.json();

		// start group logging
		// console.group("VpcLoader.load")
		// load geometry data defined in vpc features
		for (const feature of vpc.features){
			const url = feature.assets.data.href;
			const getter = Getter.http(url);
			const copc = await Copc.create(getter);

			const copcGeometry = new PointCloudCopcGeometry(getter, copc);
			// assign root tree node to base geometry class
			copcGeometry.root = new PointCloudCopcGeometryNode(copcGeometry);
			await copcGeometry.root.load();

			// create pointcloud
			const pointcloud = new PointCloudOctree(copcGeometry);
			// use feature id as pointcloud name
			pointcloud.name = feature.id

			// calculate "overall" elevationRange
			minRange = minRange === undefined ?
				pointcloud.material.elevationRange[0] :
				Math.min(pointcloud.material.elevationRange[0], minRange);
			maxRange = maxRange === undefined ?
				pointcloud.material.elevationRange[1] :
				Math.max(pointcloud.material.elevationRange[1], minRange);

			// debugger
			// add vpcPointclouds
			vpcPointclouds.push(pointcloud)
		}

		// update elevationRange in all pointclouds
		for (const pointcloud of vpcPointclouds) {
			// debugger
			pointcloud.material.elevationRange = [
				minRange,
				maxRange
			]
		}
		// console.log("vpcGeometries...", vpcGeometries)
		// console.groupEnd()
		// return vpc pointclouds
		callback(vpcPointclouds);
	}
}
