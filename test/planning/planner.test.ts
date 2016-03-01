///<reference path="../../typings/browser.d.ts" />

import { expect } from "chai";
import { Planner } from "../../src/planning/planner";
import { Context } from "../../src/planning/context";
import { Kernel } from "../../src/kernel/kernel";
import { Binding } from "../../src/bindings/binding";
import { Request } from "../../src/planning/request";
import { Plan } from "../../src/planning/plan";
import { Target } from "../../src/planning/target";
import { Inject } from "../../src/activation/inject";
import { ParamNames } from "../../src/activation/paramnames";
import * as ERROR_MSGS from "../../src/constants/error_msgs";

describe("Planner", () => {

  it("Should be able to create instances of Context", () => {

      let kernel = new Kernel();
      let planner = new Planner();
      let context = planner.createContext(kernel);

      expect(context instanceof Context).eql(true);
      expect(context.kernel instanceof Kernel).eql(true);

  });

  it("Should be able to create a basic plan", () => {

      interface IKatanaBlade {}
      class KatanaBlade implements IKatanaBlade {}

      interface IKatanaHandler {}
      class KatanaHandler implements IKatanaHandler {}

      interface IKatana {}

      @Inject("IKatanaHandler", "IKatanaBlade")
      @ParamNames("handler", "blade")
      class Katana implements IKatana {
          public handler: IKatanaHandler;
          public blade: IKatanaBlade;
          public constructor(handler: IKatanaHandler, blade: IKatanaBlade) {
              // DO NOTHING
          }
      }

      interface IShuriken {}
      class Shuriken implements IShuriken {}

      interface INinja {}

      @Inject("IKatana", "IShuriken")
      @ParamNames("katana", "shuriken")
      class Ninja implements INinja {
          public katana: IKatana;
          public shuriken: IShuriken;
          public constructor(katana: IKatana, shuriken: IShuriken) {
              // DO NOTHING
          }
      }

      let ninjaId = "INinja";
      let shurikenId = "IShuriken";
      let katanaId = "IKatana";
      let katanaHandlerId = "IKatanaHandler";
      let katanaBladeId = "IKatanaBlade";

      let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
      let shurikenBinding = new Binding<IShuriken>(shurikenId, Shuriken);
      let katanaBinding = new Binding<IKatana>(katanaId, Katana);
      let katanaBladeBinding = new Binding<IKatanaBlade>(katanaBladeId, KatanaBlade);
      let katanaHandlerBinding = new Binding<IKatanaHandler>(katanaHandlerId, KatanaHandler);

      let kernel = new Kernel();
      kernel.bind(ninjaBinding);
      kernel.bind(shurikenBinding);
      kernel.bind(katanaBinding);
      kernel.bind(katanaBladeBinding);
      kernel.bind(katanaHandlerBinding);

      let planner = new Planner();
      let context = planner.createContext(kernel);

      /* 
      *  Expected Plan (request tree):
      *  
      *  Ninja (target "null", no metadata)
      *   -- Katana (target "katama", no metadata)
      *       -- KatanaHandler (target "blade", no metadata)
      *       -- KatanaBlade (target "blade", no metadata)
      *   -- Shuriken (target "shuriken", no metadata)
      */
      let ninjaRequest = new Request(ninjaId, context, null, null, null);
      let expectedPlan = new Plan(context, ninjaRequest);
      let katanaRequest = expectedPlan.rootRequest.addChildRequest(katanaId, null, new Target("katana", katanaId));
      let katanaHandlerRequest = katanaRequest.addChildRequest(katanaHandlerId, null, new Target("handler", katanaHandlerId));
      let katanaBladeRequest = katanaRequest.addChildRequest(katanaBladeId, null, new Target("blade", katanaBladeId));
      let shurikenRequest = expectedPlan.rootRequest.addChildRequest(shurikenId, null, new Target("shuriken", shurikenId));

      // Actual
      let actualPlan = planner.createPlan(context, ninjaBinding);
      let actualNinjaRequest = actualPlan.rootRequest;
      let actualKatanaRequest = actualNinjaRequest.childRequests[0];
      let actualKatanaHandlerRequest = actualKatanaRequest.childRequests[0];
      let actualKatanaBladeRequest = actualKatanaRequest.childRequests[1];
      let actualShurikenRequest = actualNinjaRequest.childRequests[1];

      expect(actualNinjaRequest.service)
        .eql(ninjaRequest.service);

      expect(actualNinjaRequest.target)
        .eql(ninjaRequest.target);

      expect(actualNinjaRequest.childRequests.length)
        .eql(ninjaRequest.childRequests.length);

      // IKatana

      expect(actualKatanaRequest.service)
        .eql(katanaRequest.service);

      expect((<any>actualKatanaRequest.bindings[0].implementationType).name)
        .eql((<any>Katana).name);

      expect(actualKatanaRequest.bindings.length).eql(1);

      expect(actualKatanaRequest.target.service.value())
        .eql(katanaRequest.target.service.value());

      expect(actualKatanaRequest.childRequests.length)
        .eql(katanaRequest.childRequests.length);

      // IKatanaHandler

      expect(actualKatanaHandlerRequest.service)
        .eql(katanaHandlerRequest.service);

      expect((<any>actualKatanaHandlerRequest.bindings[0].implementationType).name)
        .eql((<any>KatanaHandler).name);

      expect(actualKatanaHandlerRequest.bindings.length).eql(1);

      expect(actualKatanaHandlerRequest.target.service.value())
        .eql(katanaHandlerRequest.target.service.value());

      // IKatanaBalde

      expect(actualKatanaBladeRequest.service)
        .eql(katanaBladeRequest.service);

      expect((<any>actualKatanaBladeRequest.bindings[0].implementationType).name)
        .eql((<any>KatanaBlade).name);

      expect(actualKatanaBladeRequest.bindings.length).eql(1);

      expect(actualKatanaBladeRequest.target.service.value())
        .eql(katanaBladeRequest.target.service.value());

      // IShuriken

      expect(actualShurikenRequest.service)
        .eql(shurikenRequest.service);

      expect((<any>actualShurikenRequest.bindings[0].implementationType).name)
        .eql((<any>Shuriken).name);

      expect(actualShurikenRequest.bindings.length).eql(1);

      expect(actualShurikenRequest.target.service.value())
        .eql(shurikenRequest.target.service.value());

  });

    it("Should generate plans with multi-injections", () => {

        // TODO 2.0.0-alpha.3 throw for now

        interface IWeapon {}

        class Katana implements IWeapon {}
        class Shuriken implements IWeapon {}

        interface INinja {}

        @Inject("IWeapon", "IWeapon")
        @ParamNames("katana", "shuriken")
        class Ninja implements INinja {
            public katana: IWeapon;
            public shuriken: IWeapon;
            public constructor(katana: IWeapon, shuriken: IWeapon) {
                // DO NOTHING
            }
        }

        let ninjaId = "INinja";
        let weaponId = "IWeapon";

        let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
        let shurikenBinding = new Binding<IWeapon>(weaponId, Shuriken);
        let katanaBinding = new Binding<IWeapon>(weaponId, Katana);

        let kernel = new Kernel();
        kernel.bind(ninjaBinding);
        kernel.bind(shurikenBinding);
        kernel.bind(katanaBinding);

        let throwErroFunction = () => {
            kernel.get(ninjaId);
        };

        expect(throwErroFunction).to.throw(`${ERROR_MSGS.AMBIGUOUS_MATCH} ${weaponId}`);

    });

});
