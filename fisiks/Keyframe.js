import { Quat, Vec3 } from "../lib/TSM.js";
export class Keyframe {
    /**
     *
     * @param startPos List of bone.positions
     * @param endPos List of bone.endpoints
     * @param rot List of bone.rotations
     * @param time The time for this Keyframe
     */
    constructor(startPos, endPos, rot, time) {
        this.startPositions = startPos;
        this.endPositions = endPos;
        this.rotations = rot;
        this.time = time;
    }
    getStart() {
        return this.startPositions;
    }
    getEnd() {
        return this.endPositions;
    }
    getRotation() {
        return this.rotations;
    }
    getKeyTime() {
        return this.time;
    }
    /**
     * Applies rotations to the list of bones for a frame.
     * Doesn't return anything but modifies the list of bones.
     *
     * @param rots List of Rotations for a frame
     * @param scene Needed to get the list of bones
     */
    static interpolate(rots, boneList) {
        for (let i = 0; i < boneList.length; i++) {
            const bone = boneList[i];
            if (bone.parent != -1) {
                // We only want to perform the rotation chain off of a "root" bone
                continue;
            }
            const boneQuat = rots[i];
            bone.rotation = boneQuat.copy();
            // Update the "root" bone endpoint (rotation)
            const originalBoneDir = bone.initialEndpoint.subtract(bone.initialPosition, new Vec3());
            bone.endpoint = bone.rotation.multiplyVec3(originalBoneDir).add(bone.initialPosition);
            // Recursively apply to children
            bone.children.forEach(childID => {
                this.recurseBoneMove(childID, bone.rotation, bone.initialPosition, bone.position, rots, boneList);
            });
        }
    }
    /**
     * Recursively applies the boneRot to all children of childBone (boneList[childID])
     * @param childID ID of the child(current) bone
     * @param boneRot Current Quaternion to apply rotation
     * @param boneOriginalPos parentBone Original Position
     * @param bonePos parentBone Current Position (after rotating)
     * @param rots List of Rotations, stored inside a KeyFrame
     * @param boneList List of Bones to Index
     */
    static recurseBoneMove(childID, boneRot, boneOriginalPos, bonePos, rots, boneList) {
        const childBone = boneList[childID];
        // Rotate the "disjoint" vector, apply to position
        childBone.position = bonePos.add(boneRot.multiplyVec3(childBone.initialPosition.subtract(boneOriginalPos, new Vec3())), new Vec3());
        childBone.rotation = rots[childID].copy();
        // Rotate the Original childBone Direction by the stored KeyFrame rotation
        childBone.endpoint = childBone.position.add(childBone.rotation.multiplyVec3(childBone.initialEndpoint.subtract(childBone.initialPosition, new Vec3())), new Vec3());
        childBone.children.forEach(nextChildID => {
            this.recurseBoneMove(nextChildID, childBone.rotation, childBone.initialPosition, childBone.position, rots, boneList);
        });
    }
    /**
     *
     * @param start Starting Frame Quaternion Data
     * @param end Ending Frame Quaternion Data
     * @param t Interpolation Moment in Time
     * @returns The Rotations for the current inbetween frame
     */
    static interpolateQuat(start, end, t) {
        let newRots = [];
        for (let i = 0; i < start.length; i++) {
            const interp = Quat.slerpShort(start[i], end[i], t);
            newRots.push(interp);
        }
        return newRots;
    }
}
//# sourceMappingURL=Keyframe.js.map