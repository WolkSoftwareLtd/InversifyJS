///<reference path="../../typings/browser.d.ts" />

import { expect } from "chai";
import * as sinon from "sinon";
import { Kernel } from "../../src/kernel/kernel";
import { Binding } from "../../src/bindings/binding";
import * as ERROR_MSGS from "../../src/constants/error_msgs";

describe("Kernel", () => {

  let sandbox: Sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("Should be able to store bindings", () => {

      interface INinja {}
      class Ninja implements INinja {}

      let kernel = new Kernel();
      let binding = new Binding<INinja>("INinja", Ninja);
      kernel.bind(binding);

      let _kernel: any = kernel;
      let runtimeIdentifier = _kernel._bindingDictionary._dictionary[0].key;
      expect(runtimeIdentifier).eql(binding.runtimeIdentifier);

  });

  it("Should unbind a binding when requested", () => {

      interface INinja {}
      class Ninja implements INinja {}

      let kernel = new Kernel();
      let binding = new Binding<INinja>("INinja", Ninja);
      kernel.bind(binding);

      let _kernel: any = kernel;
      let runtimeIdentifier = _kernel._bindingDictionary._dictionary[0].key;
      expect(runtimeIdentifier).eql(binding.runtimeIdentifier);

      kernel.unbind("INinja");
      let length = _kernel._bindingDictionary._dictionary.length;
      expect(length).eql(0);

  });

  it("Should throw when cannot unbind", () => {

      interface INinja {}
      class Ninja implements INinja {}

      let runtimeIdentifier = "INinja";
      let kernel = new Kernel();
      let throwFunction = () => { kernel.unbind("INinja"); };
      expect(throwFunction).to.throw(`${ERROR_MSGS.CANNOT_UNBIND} ${runtimeIdentifier}`);

  });

  it("Should unbind a binding when requested", () => {

      interface INinja {}
      class Ninja implements INinja {}
      interface ISamurai {}
      class Samurai implements ISamurai {}

      let ninjaId = "INinja";
      let samuraiId = "ISamurai";

      let kernel = new Kernel();
      let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
      let samuraiBinding = new Binding<ISamurai>(samuraiId, Samurai);

      kernel.bind(ninjaBinding);
      kernel.bind(samuraiBinding);

      let _kernel: any = kernel;
      let dictionary = _kernel._bindingDictionary._dictionary;

      expect(dictionary.length).eql(2);
      expect(dictionary[0].key).eql(ninjaId);
      expect(dictionary[1].key).eql(samuraiId);

      kernel.unbind(ninjaId);
      dictionary = _kernel._bindingDictionary._dictionary;
      expect(dictionary.length).eql(1);

  });

  it("Should NOT be able to get unbound dependencies", () => {
    // TODO
  });

  it("Should be able unbound all dependencies", () => {

      interface INinja {}
      class Ninja implements INinja {}
      interface ISamurai {}
      class Samurai implements ISamurai {}

      let ninjaId = "INinja";
      let samuraiId = "ISamurai";

      let kernel = new Kernel();
      let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
      let samuraiBinding = new Binding<ISamurai>(samuraiId, Samurai);

      kernel.bind(ninjaBinding);
      kernel.bind(samuraiBinding);

      let _kernel: any = kernel;
      let dictionary = _kernel._bindingDictionary._dictionary;

      expect(dictionary.length).eql(2);
      expect(dictionary[0].key).eql(ninjaId);
      expect(dictionary[1].key).eql(samuraiId);

      kernel.unbindAll();
      dictionary = _kernel._bindingDictionary._dictionary;
      expect(dictionary.length).eql(0);

  });

  it("Should NOT be able to get unregistered services", () => {

      interface INinja {}
      class Ninja implements INinja {}
      let ninjaId = "INinja";

      let kernel = new Kernel();
      let throwFunction = () => { kernel.get<INinja>(ninjaId); };

      expect(throwFunction).to.throw(`${ERROR_MSGS.NOT_REGISTERED} ${ninjaId}`);
  });

  it("Should be able to get a registered and not ambiguous service", () => {

      interface INinja {
          name: string;
      }

      class Ninja implements INinja {

          public name: string;

          public constructor(name) {
              this.name = name;
          }
      }

      let ninjaId = "INinja";
      let ninjaName = "Ryu Hayabusa";

      let kernel = new Kernel();
      let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
      kernel.bind(ninjaBinding);

      let _kernel: any = kernel;
      let dictionary = _kernel._bindingDictionary._dictionary;

      // pre conditions
      expect(dictionary.length).eql(1);
      expect(dictionary[0].key).eql(ninjaId);
      expect(dictionary[0].value.length).eql(1);

      // mock planner and resolver
      let planner = _kernel._planner;
      let resolver = _kernel._resolver;

      let plannerCreateContextStub = sandbox.stub(planner, "createContext").returns({
          addPlan: function() { /* DO NOTHING */ }
      });

      let plannerCreatePlanStub = sandbox.stub(planner, "createPlan").returns(null);
      let resolverResolveStub =  sandbox.stub(resolver, "resolve").returns(new Ninja(ninjaName));

      let ninja = kernel.get<INinja>(ninjaId);
      expect(ninja.name).eql(ninjaName);
      expect(resolverResolveStub.calledOnce).eql(true);
      expect(plannerCreateContextStub.calledOnce).eql(true);
      expect(plannerCreatePlanStub.calledOnce).eql(true);

  });

  it("Should NOT be able to get ambiguous match", () => {

      interface IWarrior {}
      class Ninja implements IWarrior {}
      class Samurai implements IWarrior {}

      let warriorId = "IWarrior";

      let kernel = new Kernel();
      let ninjaBinding = new Binding<IWarrior>(warriorId, Ninja);
      let samuraiBinding = new Binding<IWarrior>(warriorId, Samurai);

      kernel.bind(ninjaBinding);
      kernel.bind(samuraiBinding);

      let _kernel: any = kernel;
      let dictionary = _kernel._bindingDictionary._dictionary;

      expect(dictionary.length).eql(1);
      expect(dictionary[0].key).eql(warriorId);
      expect(dictionary[0].value.length).eql(2);

      let throwFunction = () => { kernel.get<IWarrior>(warriorId); };
      expect(throwFunction).to.throw(`${ERROR_MSGS.AMBIGUOUS_MATCH} ${warriorId}`);

  });

  it("Should NOT be able to getAll of an unregistered services", () => {

      interface INinja {}
      class Ninja implements INinja {}
      let ninjaId = "INinja";

      let kernel = new Kernel();
      let throwFunction = () => { kernel.getAll<INinja>(ninjaId); };

      expect(throwFunction).to.throw(`${ERROR_MSGS.NOT_REGISTERED} ${ninjaId}`);

  });

  it("Should be able to getAll of a registered and not ambiguous service", () => {

      interface INinja {
          name: string;
      }

      class Ninja implements INinja {

          public name: string;

          public constructor(name) {
              this.name = name;
          }
      }

      let ninjaId = "INinja";
      let ninjaName = "Ryu Hayabusa";

      let kernel = new Kernel();
      let ninjaBinding = new Binding<INinja>(ninjaId, Ninja);
      kernel.bind(ninjaBinding);

      let _kernel: any = kernel;
      let dictionary = _kernel._bindingDictionary._dictionary;

      // pre conditions
      expect(dictionary.length).eql(1);
      expect(dictionary[0].key).eql(ninjaId);
      expect(dictionary[0].value.length).eql(1);

      // mock planner and resolver
      let planner = _kernel._planner;
      let resolver = _kernel._resolver;

      let plannerCreateContextStub = sandbox.stub(planner, "createContext").returns({
          addPlan: function() { /* DO NOTHING */ }
      });

      let plannerCreatePlanStub = sandbox.stub(planner, "createPlan").returns(null);
      let resolverResolveStub =  sandbox.stub(resolver, "resolve").returns(new Ninja(ninjaName));

      let ninjas = kernel.getAll<INinja>(ninjaId);
      expect(ninjas.length).eql(1);
      expect(ninjas[0].name).eql(ninjaName);
      expect(resolverResolveStub.calledOnce).eql(true);
      expect(plannerCreateContextStub.calledOnce).eql(true);
      expect(plannerCreatePlanStub.calledOnce).eql(true);

  });

  it("Should be able to getAll of an ambiguous service", () => {

      interface IWarrior {
          name: string;
      }

      class Ninja implements IWarrior {

          public name: string;

          public constructor(name) {
              this.name = name;
          }
      }

      class Samurai implements IWarrior {

          public name: string;

          public constructor(name) {
              this.name = name;
          }
      }

      let warriorId = "IWarrior";
      let ninjaName = "Ryu Hayabusa";
      let samuraiName = "Katsumoto";

      let kernel = new Kernel();
      let ninjaBinding = new Binding<IWarrior>(warriorId, Ninja);
      let samuraiBinding = new Binding<IWarrior>(warriorId, Samurai);

      kernel.bind(ninjaBinding);
      kernel.bind(samuraiBinding);

      let _kernel: any = kernel;
      let dictionary = _kernel._bindingDictionary._dictionary;

      // pre conditions
      expect(dictionary.length).eql(1);
      expect(dictionary[0].key).eql(warriorId);
      expect(dictionary[0].value.length).eql(2);

      // mock planner and resolver
      let planner = _kernel._planner;
      let resolver = _kernel._resolver;

      let plannerCreateContextStub = sandbox.stub(planner, "createContext").returns({
          addPlan: function() { /* DO NOTHING */ }
      });

      let plannerCreatePlanStub = sandbox.stub(planner, "createPlan").returns(null);
      let resolverResolveStub =  sandbox.stub(resolver, "resolve");

      resolverResolveStub.onCall(0).returns(new Ninja(ninjaName));
      resolverResolveStub.onCall(1).returns(new Samurai(samuraiName));

      let warriors = kernel.getAll<IWarrior>(warriorId);
      expect(warriors.length).eql(2);
      expect(warriors[0].name).eql(ninjaName);
      expect(warriors[1].name).eql(samuraiName);
      expect(resolverResolveStub.callCount).eql(2);
      expect(plannerCreateContextStub.callCount).eql(2);
      expect(plannerCreatePlanStub.callCount).eql(2);

  });

});
