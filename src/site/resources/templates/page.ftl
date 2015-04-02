<#include "header.ftl">

<#if content.body??>
  <div class="page-header" id="content">
    <div class="container">
      <div class="row">
        <div class="col-sm-12">
          <h1>${content.heading!"Vert.x"}</h1>
        </div>
      </div>
    </div>
  </div>
  ${content.body}
<#else>
  <#include "index.html">
</#if>

<#include "footer.ftl">
