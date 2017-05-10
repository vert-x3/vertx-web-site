---
title: Time scheduling with Chime
template: post.html
date: 2017-05-09
author: LisiLisenok
draft: false 
---

## Time scheduling.  

Eclipse Vert.x executes periodic and delayed actions with
[periodic and one-shot timers](http://vertx.io/docs/vertx-core/java/#_executing_periodic_and_delayed_actions).
This is the base for time scheduling and reach feature extension must be rather interesting.
Be notified at certain date / time, take into account holidays,
repeat notifications until a given date, apply time zone,
take into account daylight saving time etc.
There are a lot of useful features time scheduler may introduce to the Vert.x stack.  


## Chime.  

 [Chime](https://github.com/LisiLisenok/Chime) is time scheduler verticle which works on _Vert.x_ event bus and provides:  
 * scheduling with _cron-style_, _interval_ or _union_ timers:
 	* at a certain time of day (to the second);  
 	* on certain days of the week, month or year;  
 	* with a given time interval;  
 	* with nearly any combination of all of above;  
 	* repeating a given number of times;  
 	* repeating until a given time / date;  
 	* repeating infinitely  
 * proxying event bus with conventional interfaces  
 * applying time zones available on _JVM_ with daylight saving time taken into account  
 * flexible timers management system:  
 	* grouping timers;  
 	* defining a timer start or end times  
 	* pausing / resuming;  
 	* fire counting;  
 * listening and sending messages via event bus with _JSON_;  
 * _publishing_ or _sending_ timer fire event to the address of your choice.  

[INFO _Chime_ is written in [Ceylon](https://ceylon-lang.org) and is available at
[Ceylon Herd](https://herd.ceylon-lang.org/modules/herd.schedule.chime).]  


## Running.  

### Ceylon users.  

Deploy _Chime_ using `Verticle.deployVerticle` method.  

```Ceylon
import io.vertx.ceylon.core {vertx}
import herd.schedule.chime {Chime}
Chime().deploy(vertx.vertx());
```
 
Or with `vertx.deployVerticle(\"ceylon:herd.schedule.chime/0.2.1\");`
but ensure that Ceylon verticle factory is available at class path.   

### Java users.  

1. Ensure that Ceylon verticle factory is available at class path.  
2. Put Ceylon versions to consistency. For instance, Vert.x 3.4.1 depends on Ceylon 1.3.0
   while Chime 0.2.1 depends on Ceylon 1.3.2. 
3. [Deploy verticle](http://vertx.io/docs/vertx-core/java/#_deploying_verticles_programmatically), like:  
```Java
vertx.deployVerticle("ceylon:herd.schedule.chime/0.2.1")
```

[INFO example with Maven is available at [Github](https://github.com/LisiLisenok/ChimeJavaExample).]  


## Schedulers.  

Well, _Chime_ verticle is deployed. Let's see its structure.  
In order to provide flexible and broad ways to manage timing two level architecture is adopted.
It consists of schedulers and timers. Timer is a unit which fires at a given time.
While scheduler is a set or group of timers and provides following:    
* creating and deleting timers;  
* pausing / resuming all timers working within the scheduler;  
* info on the running timers;  
* default time zone;  
* listening event bus at the given scheduler address for the requests to.  

Any timer operates within some scheduler. And one or several schedulers have to be created before starting scheduling.  
When _Chime_ verticle is deployed it starts listen event bus at **chime** address (can be configured).
In order to create scheduler send to this address a JSON message.  

```json
{
	"operation": "create",
	"name": "scheduler name"
}
```


Once scheduler is created it starts listen event bus at **scheduler name** address.
Sending messages to **chime** address or to **scheduler name** address are rather equivalent,
excepting that chime address provides services for every scheduler, while scheduler address
provides services for this particular scheduler only.  
The request sent to the _Chime_ has to contain **operation** and **name** keys.
Name key provides scheduler or timer name. While operation key shows an action _Chime_ has to perform.
There are only four possible operations:  
* create - create new scheduler or timer;  
* delete - delete scheduler or timer;  
* info - request info on _Chime_ or on a particular scheduler or timer;  
* state - set or get scheduler or timer state (running, paused or completed).  


## Timers.  

Now we have scheduler created and timers can be run within. There are two ways to access a given timer:  
1. Sending message to **chime** address with 'name' field set to **scheduler name:timer name**.  
2. Sending message to **scheduler name** address with 'name' field set to either **timer name** or **scheduler name:timer name**.  

[Timer request](https://modules.ceylon-lang.org/repo/1/herd/schedule/chime/0.2.1/module-doc/api/index.html#timer-request) is rather complicated and contains a lot of details. In this blog post only basic features are considered:  

```json
{
	"operation": "create",
	"name": "scheduler name:timer name",
	"description": {}
};
```

This is rather similar to request sent to create a scheduler.
The difference is only **description** field is added.
This description is an JSON object which identifies particular timer type and its details.  
The other fields not shown here are optional and includes:  
* initial timer state (paused or running);  
* start or end date-time;  
* number of repeating times;  
* is timer message to be published or sent;  
* timer fire message and delivery options;  
* time zone.  


## Timer descriptions.  

Currently, three types of timers are supported:  

* __Interval timer__ which fires after each given time period (minimum 1 second):  
```json
{
	"type": "interval",
	"delay": "timer delay in seconds, Integer"
};
```  

* __Cron style timer__ which is defined with cron-style:  
```json
{  
	"type": "cron",  
	"seconds": "seconds in cron style, String",  
	"minutes": "minutes in cron style, String",  
	"hours": "hours in cron style, String",  
	"days of month": "days of month in cron style, String",  
	"months": "months in cron style, String",  
	"days of week": "days of week in cron style, String, optional",  
	"years": "years in cron style, String, optional"  
};
```  
Cron timer is rather powerful and flexible. Investigate [specification](https://modules.ceylon-lang.org/repo/1/herd/schedule/chime/0.2.1/module-doc/api/index.html#cron-expression) for the complete list of features.  

* __Union timer__ which combines a number of timers into a one:  
```json
{  
	"type": "union",  
	"timers": ["list of the timer descriptions"]  
};
```  
Union timer may be useful to fire at a list of specific dates / times.


## Timer events.  

Once timer is started it sends or publishes messages to **scheduler name:timer name** address in JSON format.
Two types of events are sent:  
* fire event which occurs when time reaches next timer value:  
```json
{  
	"name": "scheduler name:timer name, String",  
	"event": "fire",  
	"count": "total number of fire times, Integer",  
	"time": "ISO formated time / date, String",  
	"seconds": "number of seconds since last minute, Integer",  
	"minutes": "number of minutes since last hour, Integer",  
	"hours": "hour of day, Integer",  
	"day of month": "day of month, Integer",  
	"month": "month, Integer",  
	"year": "year, Integer",  
	"time zone": "time zone the timer works in, String"
};
```  
* complete event which occurs when timer is exhausted by some criteria given at timer create request:  
```json
{  
	"name": "scheduler name:timer name, String",  
	"event": "complete",  
	"count": "total number of fire times, Integer"  
};
```

Basically, now we know everything to be happy with _Chime_: schedulers and requests to them, timers and timer events.
Will see some examples in the next section.  


## Examples.  

### Ceylon example.  

Let's consider a timer which has to fire every month at 16-30 last Sunday.  

```Ceylon
// listen the timer events
eventBus.consumer (
	"my scheduler:my timer",
	(Throwable|Message<JsonObject?> msg) {
		if (is Message<JsonObject?> msg) { print(msg.body()); }
		else { print(msg); }	
	}
);
// create scheduler and timer
eventBus.send<JsonObject> (
	"chime",
	JsonObject {
		"operation" -> "create",
		"name" -> "my scheduler:my timer",
		"description" -> JsonObject {
			"type" -> "cron",
			"seconds" -> "0",
			"minutes" -> "30",
			"hours" -> "16",
			"days of month" -> "*",
			"months" -> "*",
			"days of week" -> "SundayL"
		}
	}
);

```

[INFO '*' means any, 'SundayL' means last Sunday.]  

[NOTE If 'create' request is sent to Chime address with name set to 'scheduler name:timer name' and corresponding scheduler hasn't been created before then Chime creates both new scheduler and new timer.]  


### Java example.  

Let's consider a timer which has to fire every Monday at 8-30 and every Friday at 17-30.  

```Java
// listen the timer events
MessageConsumer<JsonObject> consumer = eventBus.consumer("my scheduler:my timer");
consumer.handler (
	message -> {
		System.out.println(message.body());
  	}
);
// description of timers
JsonObject mondayTimer = (new JsonObject()).put("type", "cron")
	.put("seconds", "0").put("minutes", "30").put("hours", "8")
	.put("days of month", "*").put("months", "*")
	.put("days of week", "Monday");
JsonObject fridayTimer = (new JsonObject()).put("type", "cron")
	.put("seconds", "0").put("minutes", "30").put("hours", "17")
	.put("days of month", "*").put("months", "*")
	.put("days of week", "Friday");
// union timer - combines mondayTimer and fridayTimer
JsonArray combination = (new JsonArray()).add(mondayTimer)
	.add(fridayTimer);
JsonObject timer = (new JsonObject()).put("type", "union")
	.put("timers", combination);
// create scheduler and timer
eventBus.send (
	"chime",
	(new JsonObject()).put("operation", "create")
		.put("name", "my scheduler:my timer")
		.put("description", timer)
);
```  

[IMPORTANT Ensure that Ceylon verticle factory with right version is available at class path.]  


## At the end.  

`herd.schedule.chime` module provides some features not mentioned here:  
* convenient builders useful to fill in JSON description of various timers;  
* proxying event bus with conventional interfaces;  
* reading JSON timer event into an object;  
* attaching JSON message to the timer fire event;  
* managing time zones.  

There are also some ideas for the future:  
* custom or user-defined timers;  
* limiting the timer fire time / date with calendar;  
* extracting timer fire message from external source.  

-----------------------------

This is very quick introduction to the _Chime_ and if you are interested in you may read
more in [Chime documentation](https://modules.ceylon-lang.org/repo/1/herd/schedule/chime/0.2.1/module-doc/api/index.html) or even [contribute](https://github.com/LisiLisenok/Chime) to.  

Thank's for the reading and enjoy with coding!  
