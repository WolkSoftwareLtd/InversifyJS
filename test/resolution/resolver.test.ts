///<reference path="../../typings/browser.d.ts" />

import { expect } from "chai";
import * as sinon from "sinon";
import { Resolver } from "../../src/resolution/resolver";
import { Planner } from "../../src/planning/planner";
import { Kernel } from "../../src/kernel/kernel";
import { Binding } from "../../src/bindings/binding";
import { Request } from "../../src/planning/request";
import { Plan } from "../../src/planning/plan";
import { Target } from "../../src/planning/target";
import { Inject } from "../../src/activation/inject";
import { ParamNames } from "../../src/activation/paramnames";
import { BindingScope } from "../../src/bindings/binding_scope";

describe("Resolver", () => {

  let sandbox: Sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("Should be able to resolve a basic plan", () => {

      interface IKatanaBlade {}
      class KatanaBlade implements IKatanaBlade {}

      interface IKatanaHandler {}
      class KatanaHandler implements IKatanaHandler {}

      interface IKatana {
          handler: IKatanaHandler;
          blade: IKatanaBlade;
      }

      @Inject("IKatanaHandler", "IKatanaBlade")
      @ParamNames("handler", "blade")
      class Katana implements IKatana {
          public handler: IKatanaHandler;
          public blade: IKatanaBlade;
          public constructor(handler: IKatanaHandler, blade: IKatanaBlade) {
              this.handler = handler;
              this.blade = blade;
          }
      }

      interface IShuriken {}
      class Shuriken implements IShuriken {}

      interface INinja {
          katana: IKatana;
          shuriken: IShuriken;
      }

      @Inject("IKatana", "IShuriken")
      @ParamNames("katana", "shuriken")
      class Ninja implements INinja {
          public katana: IKatana;
          public shuriken: IShuriken;
          public constructor(katana: IKatana, shuriken: IShuriken) {
              this.katana = katana;
              this.shuriken = shuriken;
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
      *  Plan (request tree):
      *  
      *  Ninja (target "null", no metadata)
      *   -- Katana (target "katama", no metadata)
      *       -- KatanaHandler (target "blade", no metadata)
      *       -- KatanaBlade (target "blade", no metadata)
      *   -- Shuriken (target "shuriken", no metadata)
      */
      let ninjaRequest = new Request(ninjaId, context, null, ninjaBinding, null);
      let plan = new Plan(context, ninjaRequest);
      let katanaRequest = plan.rootRequest.addChildRequest(katanaId, katanaBinding, new Target("katana", katanaId));
      katanaRequest.addChildRequest(katanaHandlerId, katanaHandlerBinding, new Target("handler", katanaHandlerId));
      katanaRequest.addChildRequest(katanaBladeId, katanaBladeBinding, new Target("blade", katanaBladeId));
      plan.rootRequest.addChildRequest(shurikenId, shurikenBinding, new Target("shuriken", shurikenId));
      context.addPlan(plan);

      let resolver = new Resolver();
      let ninja = resolver.resolve<INinja>(context);

      expect(ninja instanceof Ninja).eql(true);
      expect(ninja.katana instanceof Katana).eql(true);
      expect(ninja.katana.handler instanceof KatanaHandler).eql(true);
      expect(ninja.katana.blade instanceof KatanaBlade).eql(true);
      expect(ninja.shuriken instanceof Shuriken).eql(true);

  });

  it("Should store singleton type bindings in cache", () => {

      interface IKatanaBlade {}
      class KatanaBlade implements IKatanaBlade {}

      interface IKatanaHandler {}
      class KatanaHandler implements IKatanaHandler {}

      interface IKatana {
          handler: IKatanaHandler;
          blade: IKatanaBlade;
      }

      @Inject("IKatanaHandler", "IKatanaBlade")
      @ParamNames("handler", "blade")
      class Katana implements IKatana {
          public handler: IKatanaHandler;
          public blade: IKatanaBlade;
          public constructor(handler: IKatanaHandler, blade: IKatanaBlade) {
              this.handler = handler;
              this.blade = blade;
          }
      }

      interface IShuriken {}
      class Shuriken implements IShuriken {}

      interface INinja {
          katana: IKatana;
          shuriken: IShuriken;
      }

      @Inject("IKatana", "IShuriken")
      @ParamNames("katana", "shuriken")
      class Ninja implements INinja {
          public katana: IKatana;
          public shuriken: IShuriken;
          public constructor(katana: IKatana, shuriken: IShuriken) {
              this.katana = katana;
              this.shuriken = shuriken;
          }
      }

      let ninjaId = "INinja";
      let shurikenId = "IShuriken";
      let katanaId = "IKatana";
      let katanaHandlerId = "IKatanaHandler";
      let katanaBladeId = "IKatanaBlade";

      let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
      let shurikenBinding = new Binding<IShuriken>(shurikenId, Shuriken);
      let katanaBinding = new Binding<IKatana>(katanaId, Katana, BindingScope.Singleton); // SINGLETON!
      let katanaBladeBinding = new Binding<IKatanaBlade>(katanaBladeId, KatanaBlade);
      let katanaHandlerBinding = new Binding<IKatanaHandler>(katanaHandlerId, KatanaHandler, BindingScope.Singleton); // SINGLETON!

      let kernel = new Kernel();
      kernel.bind(ninjaBinding);
      kernel.bind(shurikenBinding);
      kernel.bind(katanaBinding);
      kernel.bind(katanaBladeBinding);
      kernel.bind(katanaHandlerBinding);

      let planner = new Planner();
      let context = planner.createContext(kernel);

      /* 
      *  Plan (request tree):
      *  
      *  Ninja (target "null", no metadata)
      *   -- Katana (target "katama", no metadata)
      *       -- KatanaHandler (target "blade", no metadata)
      *       -- KatanaBlade (target "blade", no metadata)
      *   -- Shuriken (target "shuriken", no metadata)
      */
      let ninjaRequest = new Request(ninjaId, context, null, ninjaBinding, null);
      let plan = new Plan(context, ninjaRequest);
      let katanaRequest = plan.rootRequest.addChildRequest(katanaId, katanaBinding, new Target("katana", katanaId));
      katanaRequest.addChildRequest(katanaHandlerId, katanaHandlerBinding, new Target("handler", katanaHandlerId));
      katanaRequest.addChildRequest(katanaBladeId, katanaBladeBinding, new Target("blade", katanaBladeId));
      plan.rootRequest.addChildRequest(shurikenId, shurikenBinding, new Target("shuriken", shurikenId));
      context.addPlan(plan);

      let resolver = new Resolver();
      let createInstanceSpy = sandbox.spy(resolver, "_createInstance");

      let _kernel: any = kernel;
      expect(_kernel._bindingDictionary.get("IKatana")[0].cache === null).eql(true);

      expect(createInstanceSpy.callCount).eql(0);
      let ninja = resolver.resolve<INinja>(context);
      expect(ninja instanceof Ninja).eql(true);
      expect(createInstanceSpy.callCount).eql(2);
      expect(createInstanceSpy.getCall(0).args[0].name === "Katana").eql(true);
      expect(createInstanceSpy.getCall(1).args[0].name === "Ninja").eql(true);

      let ninja2 = resolver.resolve<INinja>(context);
      expect(ninja2 instanceof Ninja).eql(true);
      expect(createInstanceSpy.callCount).eql(3);
      expect(createInstanceSpy.getCall(1).args[0].name === "Ninja").eql(true);

      expect(_kernel._bindingDictionary.get("IKatana")[0].cache instanceof Katana).eql(true);

  });

});
