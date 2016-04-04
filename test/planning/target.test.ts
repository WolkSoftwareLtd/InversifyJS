///<reference path="../../src/interfaces/interfaces.d.ts" />

import { expect } from "chai";
import Target from "../../src/planning/target";
import Metadata from "../../src/planning/metadata";
import * as METADATA_KEY from "../../src/constants/metadata_keys";

describe("Target", () => {

    it("Should be able to create instances of untagged tagets", () => {
        let target = new Target("katana", "IKatana");
        expect(target.service).to.be.eql("IKatana");
        expect(target.name.value()).to.be.eql("katana");
        expect(Array.isArray(target.metadata)).to.be.eql(true);
        expect(target.metadata.length).to.be.eql(0);
    });

    it("Should be able to create instances of named tagets", () => {
        let target = new Target("katana", "IKatana", "primary");
        expect(target.service).to.be.eql("IKatana");
        expect(target.name.value()).to.be.eql("katana");
        expect(Array.isArray(target.metadata)).to.be.eql(true);
        expect(target.metadata.length).to.be.eql(1);
        expect(target.metadata[0].key).to.be.eql(METADATA_KEY.NAMED_TAG);
        expect(target.metadata[0].value).to.be.eql("primary");
    });

    it("Should be able to create instances of tagged tagets", () => {
        let target = new Target("katana", "IKatana", new Metadata("power", 5));
        expect(target.service).to.be.eql("IKatana");
        expect(target.name.value()).to.be.eql("katana");
        expect(Array.isArray(target.metadata)).to.be.eql(true);
        expect(target.metadata.length).to.be.eql(1);
        expect(target.metadata[0].key).to.be.eql("power");
        expect(target.metadata[0].value).to.be.eql(5);
    });

    it("Should be able to identify named metadata", () => {
        let target1 = new Target("katana", "IKatana", "primary");
        expect(target1.isNamed()).to.be.eql(true);
        let target2 = new Target("katana", "IKatana", new Metadata("power", 5));
        expect(target2.isNamed()).to.be.eql(false);
    });

    it("Should be able to identify multi-injections", () => {
        let target1 = new Target("katana", "IKatana");
        target1.metadata.push(new Metadata(METADATA_KEY.MULTI_INJECT_TAG, "IKatana"));
        expect(target1.isArray()).to.be.eql(true);
        let target2 = new Target("katana", "IKatana");
        expect(target2.isArray()).to.be.eql(false);
    });

    it("Should be able to match named metadata", () => {
        let target1 = new Target("katana", "IKatana", "primary");
        expect(target1.matchesNamedTag("primary")).to.be.eql(true);
        expect(target1.matchesNamedTag("secondary")).to.be.eql(false);
    });

    it("Should be able to identify tagged metadata", () => {

        let target = new Target("katana", "IKatana");
        expect(target.isTagged()).to.be.eql(false);

        let target1 = new Target("katana", "IKatana", new Metadata("power", 5));
        expect(target1.isTagged()).to.be.eql(true);

        let target2 = new Target("katana", "IKatana", "primary");
        expect(target2.isTagged()).to.be.eql(false);

        let target3 = new Target("katana", "IKatana");
        target3.metadata.push(new Metadata("power", 5), new Metadata("speed", 5));
        expect(target3.isTagged()).to.be.eql(true);

    });

    it("Should be able to match tagged metadata", () => {
        let target1 = new Target("katana", "IKatana", new Metadata("power", 5));
        expect(target1.matchesTag("power")(5)).to.be.eql(true);
        expect(target1.matchesTag("power")(2)).to.be.eql(false);
    });

    it("Should be able to get a string literal identifier as a string", () => {
        let IKatana = "IKatana";
        let target = new Target("katana", IKatana);
        let KatanaStr = target.getServiceAsString();
        expect(KatanaStr).to.eql("IKatana");
    });

    it("Should be able to get a symbol identifier as a string", () => {
        let IKatanaSymbol = Symbol("IKatana");
        let target = new Target("katana", IKatanaSymbol);
        let KatanaStr = target.getServiceAsString();
        expect(KatanaStr).to.eql("Symbol(IKatana)");
    });

    it("Should be able to get a class identifier as a string", () => {
        class Katana {}
        let target = new Target("katana", Katana);
        let KatanaStr = target.getServiceAsString();
        expect(KatanaStr).to.eql("Katana");
    });

});
